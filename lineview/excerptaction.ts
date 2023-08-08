import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {listExcerpts} from '../fts/excerpt.ts';
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
		const section=name.slice(1);
		const {lines,chunks}=listExcerpts(ptk,tofind,section);

		let till=this.till;
		let from=this.from;
		if (till==-1) till=this.from+ACTIONPAGESIZE;

		let  arr=lines;
		this.first=0;
		this.last=arr.length;
		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);

		const lines2=arr.map(it=>parseInt(it[0]));
		const hits =arr.map(it=> it[1].map(n=>Math.floor(n/MAXPHRASELEN)) );
		const phraselength =arr.map(it=> it[1].map(n=>n%MAXPHRASELEN));

		const cobj=fromObj(chunks,(a,b)=>a);

		const samechunkline=cobj.length==1?cobj[0]:-1;
		const at=ptk.header.fulltext.indexOf(section);
		const caption=ptk.header.fulltextcaption[at];
		this.ownerdraw={painter:'excerpt', data:{ last:this.last, samechunkline ,
			section,
			from:this.from, name, hitcount, caption,ptk,tofind , lines:lines2,hits,phraselength}} ;
	}	
}
