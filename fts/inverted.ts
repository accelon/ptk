import {StringArray,unpackIntDelta,LEMMA_DELIMITER,bsearchNumber} from '../utils/index.ts';
import {tokenize,TokenType} from './tokenize.ts';
import {fromSim} from 'lossless-simplified-chinese'

export class Inverted {
	constructor(section:string[],postingStart:number){
		this.words = new StringArray(section.shift(),{sep:LEMMA_DELIMITER});
		this.bmpwithposting=unpackIntDelta(section.shift());
		this.tokenlinepos=unpackIntDelta(section.shift());
		this.postings=[];       //holding loaded postings
		this.postingStart=postingStart;
		this.bmppostingcount=0; //long token starts from here
		
		for (let i=1;i<65536;i++) { //ascii 0 is not used
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
				if (this.bmpwithposting[at]!==cp) {
					//try sim
					const cpsim=fromSim(text).charCodeAt(0);
					at=bsearchNumber(this.bmpwithposting, cpsim);
					if (this.bmpwithposting[at]!==cpsim) continue;
				}
			} else if (type>=TokenType.SEARCHABLE) {
				if (~at) at+=this.bmppostingcount;
				else {
					let at2=this.words.find(s);
					if (~at2) at=at2+this.bmppostingcount;
				};
			}
			out.push(at);
		}
		return out;
	}
}