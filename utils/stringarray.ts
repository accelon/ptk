/**
 * StringArray backed by a string , assuming Unix style line-break. 
 * quick setup speed as spliting is not required.
 * preventing javscript engine to generate tons of "sliced string"
 * fast random seek by linepos 
 * prebuild might save 30% loading time at the space cost of 1/average_item_size)
 * */
import {unpack,unpack_delta} from '../utils/unpackintarray.ts';
import {bsearchgetter,StringGetter} from '../utils/bsearch.ts';

export class StringArray {
	private buf:string='';
	private sep:string='';
	private linepos:number[]=[];
	constructor (buf:string,sequencialOnly:false,sep?:string){
		this.buf=buf;
		this.sep=sep||''; 
		this.now=0;
		// if (this.sep && this.sep.codePointAt(0) >=0x20) {
			// console.log('avoid using ascii bigger than space as separator, tab 0x09 is a better choice')
		// }
		//用\t (key\tvalue) ，不要用 =或 : 做分割符 ，去掉 value ，key 不必重排。(因 = 的ascii值在數字之後)
		//只做一次順序讀取，可節省 buildLinepos;
		if (!sequencialOnly) this.buildLinepos();
	}
	private buildLinepos():void{
		let prev=-1,p=0;
		while (p<this.buf.length) {
			const at=this.buf.indexOf('\n' ,prev);
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
	next() {
		const at=this.buf.indexOf('\n',this.now);
		if (at==-1) return ;
		const s=this.buf.slice(this.now,at);
		this.now=at+1;
		return s;
	}
	get(idx:number):string{ //0 zero base
		if (idx==-1) return this.linepos.length.toString() ; //for  bsearchgetter
		if (idx==0) {
			return this.buf.slice(0,this.linepos[0]-1);
		} else if (idx<=this.linepos.length) {
			return this.buf.slice(this.linepos[idx-1],this.linepos[idx]-1);
		}
		return '';
	}	
	/* find will return the closest match */
	find(pat:string):number {
		const getter:StringGetter=this.get.bind(this);
		pat+=this.sep; //key-value separator
		const at=bsearchgetter( getter, pat ); // this.get(0) return len
		const found:string=getter(at);
		return (found.startsWith(pat))?at:0;
	}
	/* if sep is missing, value is the text after key */
	getValue(key:string):string {
		const at=this.find(key);
		return at?this.get(at).slice( key.length+this.sep.length):'';
	}
}