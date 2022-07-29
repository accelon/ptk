/**
 * StringArray backed by a delimitered string. 
 * quick setup speed as spliting is not required.
 * preventing javscript engine to generate tons of "sliced string"
 * fast sequencial read and partial search (String.indexOf).
 * fast random seek by charpos at the space cost of 1/average_item_size)
 * */
import {bsearchGetter,StringGetter,bsearchNumber} from '../utils/bsearch.ts';
export const LEMMA_DELIMETER = '\x7f';
export class StringArray {
	private buf:string='';
	private sep:string='';
	private charpos:number[]=[];
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
		if (idx==0) {
			return this.buf.slice(0,this.charpos[0]-1);
		} else if (idx<=this.charpos.length) {
			return this.buf.slice(this.charpos[idx-1],this.charpos[idx]-1);
		}
		return '';
	}
	at(offset:number){
		return bsearchNumber(this.charpos,offset);
	}
	find(pat:string):number { /* return the closest match */
		const getter:StringGetter=this.get.bind(this);
		if (this.delimiter) pat+=this.delimiter; 
		const at=bsearchGetter( getter, pat )  ; // this.get(-1) return len
		const found=getter(at);
		return (found.endsWith(pat))?at:-1;
	}
	enumMiddle(infix:string):number[]{
		let idx=this.buf.indexOf(infix);
		const out=[]; 
		while (idx>-1) {
			const at=this.at(idx);
			const lp=at?this.charpos[at-1]:0;
			const lp2=this.charpos[at];
			if (idx>lp && idx<lp2) out.push(at);
			idx=this.buf.indexOf(infix,lp2+this.sep.length);
		}
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
		if (suffix[suffix.length-1]!==this.sep) suffix=suffix+this.sep;
		let idx=this.buf.indexOf(suffix);
		const out=[]; 
		while (idx>-1) {
			out.push(idx);
			idx=this.buf.indexOf(suffix,idx+this.sep.length);
		}
		return out;
	}	
	match(text:string):string[] { // find longest word
		const getter:StringGetter=this.get.bind(this);
		const at=bsearchGetter( getter, text ); // this.get(0) return len
		const out=[];
		let upper=at;
		let lower=at+1;
		while (upper>0) {
			const found=this.get(upper);
			if (text.startsWith(found))out.push( found); else break;
			upper--;
		}
		while (lower< this.len()) {
			const found=this.get(lower);
			if (text.startsWith(found)) out.push( found); else break;
			lower++;
		}
		return out;
	}
	/* if delimiter is missing, value is the text after key, ie , a fixed with key */
	getValue(key:string):string {
		const at=this.find(key);
		return ~at?this.get(at).slice( key.length+this.delimiter.length):'';
	}
}