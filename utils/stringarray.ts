/**
 * StringArray backed by a string , assuming Unix style line-break. 
 * quick setup speed as spliting is not required.
 * preventing javscript engine to generate tons of "sliced string"
 * fast random seek by linepos 
 * prebuild might save 30% loading time at the space cost of 1/average_item_size)
 * */
import {bsearchGetter,StringGetter,bsearchNumber} from '../utils/bsearch.ts';
export const LEMMA_DELIMETER = '\x7f';
export class StringArray {
	private buf:string='';
	private sep:string='';
	private linepos:number[]=[];
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
		//只做一次順序讀取，可節省 buildLinepos;
		if (!this.sequencial) this.buildLinepos();
	}
	private buildLinepos():void{
		let prev=-1,p=0;
		while (p<this.buf.length) {
			const at=this.buf.indexOf(this.sep ,prev);
			if (at==-1) {
				this.linepos.push(this.buf.length);
				break;
			} else {
				this.linepos.push(at+1);
				prev=at+1;
			}
		}
	}
	len():number{
		return this.linepos.length;
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
		if (idx==-1) return this.linepos.length.toString() ; //for  bsearchGetter
		if (idx==0) {
			return this.buf.slice(0,this.linepos[0]-1);
		} else if (idx<=this.linepos.length) {
			return this.buf.slice(this.linepos[idx-1],this.linepos[idx]-1);
		}
		return '';
	}
	at(offset:number){
		return bsearchNumber(this.linepos,offset);
	}
	endWith(str:string):number[] {
		if (str[str.length-1]!==this.sep) str=str+this.sep;
		let idx=this.buf.indexOf(str);
		const out=[]; 
		while (idx>-1) {
			out.push( this.at(idx+this.sep.length) ); //skip the 
			idx=this.buf.indexOf(str,idx+this.sep.length);
		}
		return out;
	}
	/* find will return the closest match */
	find(pat:string):number {
		const getter:StringGetter=this.get.bind(this);
		if (this.delimiter) pat+=this.delimiter; //key-value delimiter
		const at=bsearchGetter( getter, pat )  ; // this.get(-1) return len
		const found=getter(at);
		return (found.endsWith(pat))?at:-1;
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
	/* if sep is missing, value is the text after key */
	getValue(key:string):string {
		const at=this.find(key);
		return ~at?this.get(at).slice( key.length+this.delimiter.length):'';
	}
}