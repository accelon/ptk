import {StringArray,unpackIntDelta,bmpwithposting,bsearchNumber} from '../utils/index.ts';
import {tokenize,TokenType} from './tokenize.ts';

export class Inverted {
	constructor(section:string[],postingStart:number){
		this.words = new StringArray(section.shift());
		this.bmpwithposting=unpackIntDelta(section.shift());
		this.postings=[];       //holding loaded postings
		this.postingStart=postingStart;
		this.bmppostingcount=0; //long token starts from here
		for (let i=0;i<65536;i++) {
			if (this.bmpwithposting[i]) this.bmppostingcount++;
		}
	}
	nPostingOf(s:string){
		const out=[];
		const tokens=tokenize(s);
		for (let i=0;i<tokens.length;i++) {
			const {type,text} = tokens[i];
			let at=-1;
			if (type==TokenType.CJK_BMP) {
				const cp=text.charCodeAt(0);
				at=bsearchNumber(this.bmpwithposting, cp);
				if (this.bmpwithposting[at]!==cp) continue;
			} else if (type>=TokenType.SEARCHABLE) {
				if (~at) at+=this.bmppostingcount;
				else continue;
			}
			out.push(at);
		}
		return out;
	}
	getPosting(token:string){
		
	}	
}