/**
 * StringArray backed by a delimitered string. 
 * quick setup speed as spliting is not required.
 * preventing javscript engine to generate tons of "sliced string"
 * fast sequencial read and partial search (String.indexOf).
 * fast random seek by charpos at the space cost of 1/average_item_size)
 * */
import {bsearchGetter,StringGetter,bsearchNumber} from '../utils/bsearch.ts';
export const LEMMA_DELIMITER = '\x7f';
export class StringArray {
	private buf:string='';
	private sep:string='';
	private charpos:number[]=[];
	private middleCache={};
	private endCache={};
	constructor (buf:string,opts={}){
		this.sequencial=opts.sequencial;
		this.delimiter=opts.delimiter||''; //separate key and value
		this.buf=buf;
		this.sep=opts.sep||'\n';  //separate item
		this.now=0;
		// if (this.sep && this.sep.codePointAt(0) >=0x20) {
			// console.log('avoid using ascii bigger than space as separator, tab 0x09 is a better choice')
		// }
		//用\t (key\tvalue) ，不要用 =或 : 做分割符 ，去掉 value ，key 不必重排。(因 = 的ascii值在數字之後)
		//只做一次順序讀取，可節省 buildcharpos;
		if (!this.sequencial) this.buildcharpos();
	}
	private buildcharpos():void{
		let prev=-1,p=0;
		while (p<this.buf.length) {
			const at=this.buf.indexOf(this.sep ,prev);
			if (at==-1) {
				this.charpos.push(this.buf.length);
				break;
			} else {
				this.charpos.push(at+1);
				prev=at+1;
			}
		}
	}
	len():number{
		return this.charpos.length;
	}
	reset(){
		this.now=0;
	}
	first(){
		this.reset();
		return this.next();
	}
	next() {
		if (this.now==-1) return ;
		const at=this.buf.indexOf(this.sep,this.now);
		if (at==-1) {
			if (this.now>=0) {
				const lastline=this.buf.slice(this.now);
				this.now=-1;
				return lastline;
			} else {
				this.now=-1;
				return ;
			}
		}
		const s=this.buf.slice(this.now,at);
		this.now=at+1;
		return s;
	}
	get(idx:number):string{ //0 zero base
		if (this.sequencial) return null;
		if (idx==-1) return this.charpos.length.toString() ; //for  bsearchGetter
		const from = idx==0?0:this.charpos[idx-1];
		const to= this.charpos[idx]  -  (idx==this.charpos.length-1?0:1);
		return this.buf.slice(from,to);
	
	}
	at(offset:number){
		return bsearchNumber(this.charpos,offset);
	}
	find(pat:string):number { // return the closest match 
		const getter:StringGetter=this.get.bind(this);
		if (this.delimiter) pat+=this.delimiter; 
		const at=bsearchGetter( getter, pat )  ; // this.get(-1) return len
		const found=getter(at);
		return (found.endsWith(pat))?at:-1;
	}
	enumMiddle(infix:string):number[]{
		if (this.middleCache.hasOwnProperty(infix)) {
			return this.middleCache[infix];
		}
		let idx=this.buf.indexOf(infix);
		const out=[]; 
		while (idx>-1) {
			const at=this.at(idx);
			const lp=at?this.charpos[at-1]:0;
			const lp2=this.charpos[at]-1-infix.length;
			if (idx>lp && idx<lp2) {
				out.push(at);
			}
			idx=this.buf.indexOf(infix,this.charpos[at]+this.sep.length);
		}
		this.middleCache[infix]=out;
		return out;
	}
	enumStart(prefix:string):number[]{
		const getter:StringGetter=this.get.bind(this);
		let at=bsearchGetter( getter, prefix ); // this.get(0) return len
		if (at==-1) return [];
		const out=[];
		const len=this.len();
		while (at<len) {
			const found=this.get(at);
			if (found.startsWith(prefix)) out.push(at); else break;
			at++;
		}
		return out;
	}
	enumEnd(suffix:string):number[] {
		if (this.endCache.hasOwnProperty(suffix)) {
			console.log('cache')
			return this.endCache[suffix];
		}			
		if (suffix[suffix.length-1]!==this.sep) suffix=suffix+this.sep;
		let idx=this.buf.indexOf(suffix);
		const out=[]; 
		while (idx>-1 && this.buf.charAt(idx-1)!==this.sep) {
			const at=this.at(idx);
			out.push(at);
			idx=this.buf.indexOf(suffix,idx+this.sep.length);
		}
		this.endCache[suffix]=out;
		return out;
	}
	enumMode(s:string,mode=0):number[]{
		if (mode==0) return this.enumStart(s);
		else if (mode==1) return this.enumMiddle(s);
		else if (mode==2) return this.enumEnd(s);
		return [];
	}	
	match(text:string):string[] { // find longest word
		const getter:StringGetter=this.get.bind(this);
		const at=bsearchGetter( getter, text ) -1; // this.get(0) return len
		const out=[];
		let upper=at-1;
		if (text.startsWith(this.get(at))) out.push(this.get(at));
		let lower=at+1;
		while (upper>0) {
			const found=this.get(upper);
			//ascii stop immediately
			if (text.startsWith(found))out.push( found); else if (text.codePointAt(0)<0x100||text[0]!==found[0]) break;
			upper--;
		}
		while (lower< this.len()) {
			const found=this.get(lower);
			if (text.startsWith(found)) out.push( found); else if (text.codePointAt(0)<0x100||text[0]!==found[0]) break;
			lower++;
		}
		out.sort((a,b)=>b.length-a.length);
		return out;
	}
	/* if delimiter is missing, value is the text after key, ie , a fixed with key */
	getValue(key:string):string {
		const at=this.find(key);
		return ~at?this.get(at).slice( key.length+this.delimiter.length):'';
	}
	findMatches=(rawtext:string)=>{ //given a rawtext, return list of found words, naive segmentation
		let i=0;
		const out=[];
		while (i<rawtext.length) {
			const tf=rawtext.slice(i);
			const m=this.match(tf);
			if (m.length) {
				i+=m.length;
				out.push([i,m[0]]);
			} else {
				i++;
			}
		}
		return out;
	}	
}