import {parseAddress,sameAddress,IAddress,usePtk} from '../basket/index.ts';
import {parseCriteria} from '../fts/criteria.ts';
import {plTrim,plContain} from '../fts/posting.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {IAction} from './interfaces.ts';
import {unique,fromObj} from '../utils/index.ts';
const MAXITEM=100;
export const ACTIONPAGESIZE=5;
export class Action implements IAction{
	constructor (addr:IAddress,depth=0) {
		this.act=Action.parse(addr.action);
		this.action=addr.action;
		this.depth=depth;

		this.start=0; //display starting line
		this.end=0;   //display ending line
		this.first=0; //first line of the chunk
		this.last=0;  //last line of the chunk

		this.activeline=addr.activeline||-1; //highlight active line
		this.from=addr.from;
		this.till=addr.till||-1; //-1 to the end
		this.res=[];
		this.text='';
		this.lines=[];//for search result, non continous line
		this.diggable=false;
		this.ptkname=addr.ptkname;
	}
	async run(){

	}
	lineOf(idx:number){
		return this.first+idx;
	}
	getLines(){
		const out=[];
		let till=this.till;
		if (till==-1) till=this.from+ACTIONPAGESIZE; //show partial content if not mention till
		for (let i=this.from;i<till;i++) {
			const line=this.lineOf(i);
			if (line<this.first || line>=this.last) continue;
			out.push(line);
		}
		return out;
	}
	static parse(action:string){
		return parseCriteria(action);
	}
}
class FullTextAction extends Action{
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
		if (till==-1) till=this.from+this.pagesize;

		let  arr=fromObj(lineobj,(a,b)=>[a , b.sort() ]).sort((a,b)=>a[0]-b[0]);
		this.start=0;
		this.end=arr.length;
		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);
		const lines=arr.map(it=>parseInt(it[0]));
		const hits =arr.map(it=> it[1].map(n=>Math.floor(n/MAXPHRASELEN)) );
		const phraselength =arr.map(it=> it[1].map(n=>n%MAXPHRASELEN));
		this.ownerdraw={painter:'excerpt', data:{ end:this.end, 
			from:this.from, name, caption,ptk,tofind , lines,hits,phraselength}} ;
	}	
}
class QueryAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx){
		if (idx>=this.res.length) return -1;
		return this.res[idx].line;
	}
	async run(){
		const ptk=usePtk(this.ptkname);
		for (let i=0;i<this.act.length;i++) {
			let {name,tofind}=this.act[i];
			const lexicon=ptk.primarykeys[name];
			if (!lexicon) continue;
			let matcher=lexicon.enumMiddle;
			let enummode=1;
			if (tofind[0]=='^') {
				enummode=0;
				matcher=lexicon.enumStart;
				tofind=tofind.slice(1);
			} else if (tofind[tofind.length-1]=='$') { //regular expression style
				enummode=2;
				matcher=lexicon.enumEnd;
				tofind=tofind.slice(0,tofind.length-1);
			}
			const items=matcher.call(lexicon,tofind);
			const tagname=ptk.columns[name]?.attrs?.tagname;
			const foreign=ptk.columns[name]?.attrs?.foreign || ptk.columns[name]?.fieldnames[0];
			this.end=1;
			this.till=1;
			const caption=ptk.columns[name]?.caption;
			this.ownerdraw={painter:'queryresult',
			 data:{name, caption,ptk,tagname,foreign,tofind, items, lexicon}} ;
		}
	}
}

class RangeAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.eleid=this.action;
		this.address =addr;
		this.diggable=true;
	}
	async run(){
		const ptk=usePtk(this.ptkname);
		[this.first, this.last]=ptk.rangeOfAddress(this.address);
	}
}

export const createAction=(addr, depth=0)=>{
	const at=addr.action.indexOf('=');
	if (at>0) {
		if (addr.action.slice(0,1)=='*') {
			return new FullTextAction(addr, depth);
		} else {
			return new QueryAction(addr, depth);
		}
	} else {
		return new RangeAction(addr,depth);
	}
}
export const createNestingAction=(address:string,ctx)=> {
	const addr=parseAddress(address);
	if (!addr) return null;
	//補足文字型可省略的信息
	if (addr.action) ctx.actions[ctx.depth]=addr.action;
	if (addr.ptkname)  ctx.ptknames[ctx.depth]=addr.ptkname;
	addr.action= addr.action || ctx.actions[ctx.depth] || ctx.same_level_action;
	addr.ptkname= addr.ptkname || ctx.ptknames[ctx.depth] || ctx.same_level_ptkname;
	ctx.same_level_ptkname=addr.ptkname;
	ctx.same_level_action=addr.action;
	if (addr.from && addr.till&& addr.till<addr.from) addr.till=addr.from;

	return createAction(addr, ctx.depth);
}