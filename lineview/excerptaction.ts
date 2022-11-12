import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {plTrim,plContain} from '../fts/posting.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {fromObj} from '../utils/index.ts';

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
		const at=ptk.header.fulltext.indexOf(name.slice(1));
		const caption=ptk.header.fulltextcaption[at];
		const [phrases,postings]=await ptk.parseQuery(tofind);
		const sections=ptk.header.fulltext;
		const [sectionfrom,sectionto]=ptk.sectionRange(sections[at]).map(it=>ptk.inverted.tokenlinepos[it]);
		//no ranking yet
		let lineobj={};
		for (let i=0;i<postings.length;i++) {
			const pl=plTrim(postings[i], sectionfrom,sectionto);
			const [pllines,lineshits]=plContain(pl,ptk.inverted.tokenlinepos,true);
			const phraselen=phrases[i].length;
			for (let j=0;j<pllines.length;j++) {
				const line=pllines[j];
				if (!lineobj[line]) lineobj[line]=[];
				lineobj[line].push( ...lineshits[j].map(it=>it*MAXPHRASELEN + phraselen)  );
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
		this.ownerdraw={painter:'excerpt', data:{ last:this.last, 
			from:this.from, name, caption,ptk,tofind , lines,hits,phraselength}} ;
	}	
}
