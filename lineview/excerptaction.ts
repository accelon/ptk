import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {plTrim,plContain} from '../fts/posting.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {fromObj,bsearchNumber} from '../utils/index.ts';

export class ExcerptAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx:number){
		return this.lines[idx];
	}	
	async run(){
		const ptk=usePtk(this.ptkname);
		let {name,tofind}=this.act[0];
		const address=name.slice(1);
		const [first,last]=ptk.rangeOfAddress(address);
		const caption=address;//ptk.header.fulltextcaption[at];
		const sectionfrom=ptk.inverted.tokenlinepos[first];
		const sectionto=ptk.inverted.tokenlinepos[last];
		const [phrases,postings]=await ptk.parseQuery(tofind);
		let chunkobj={}, lineobj={},hitcount=0;
		const chunktag=ptk.attributes.chunktag||'ck';
		const chunklinepos=ptk.typedefOf(chunktag).linepos;
		for (let i=0;i<postings.length;i++) {
			const pl=plTrim(postings[i], sectionfrom,sectionto);
			const [pllines,lineshits]=plContain(pl,ptk.inverted.tokenlinepos,true);
			const phraselen=phrases[i].length;
			for (let j=0;j<pllines.length;j++) {
				const line=pllines[j];
				if (!lineobj[line]) lineobj[line]=[];
				lineobj[line].push( ...lineshits[j].map(it=>it*MAXPHRASELEN + phraselen)  );
				hitcount++;
				const at=bsearchNumber(chunklinepos, line);
				if (!chunkobj[chunklinepos[at]]) chunkobj[ chunklinepos[at] ]=true;
			}
		}
		let till=this.till;
		let from=this.from;
		if (till==-1) till=this.from+ACTIONPAGESIZE;

		let  arr=fromObj(lineobj,(a,b)=>[a , b.sort() ]).sort((a,b)=>a[0]-b[0]);
		this.first=0;
		this.last=arr.length;
		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);

		const lines=arr.map(it=>parseInt(it[0]));
		const hits =arr.map(it=> it[1].map(n=>Math.floor(n/MAXPHRASELEN)) );
		const phraselength =arr.map(it=> it[1].map(n=>n%MAXPHRASELEN));

		const cobj=fromObj(chunkobj,(a,b)=>a);
		const samechunkline=cobj.length==1?cobj[0]:-1;

		this.ownerdraw={painter:'excerpt', data:{ last:this.last, samechunkline , 
			from:this.from, name, hitcount, caption,ptk,tofind , lines,hits,phraselength}} ;
	}	
}
