import {parseAddress,parseElementId,sameAddress,IAddress,usePtk} from '../basket/index.ts';
import {parseQuery} from '../fts/criteria.ts';
import {IAction} from './interfaces.ts';
const MAXITEM=100;
export const ACTIONPAGESIZE=5;
export class Action implements IAction{
	constructor (addr:IAddress,depth=0) {
		this.act=Action.parse(addr.action);
		this.action=addr.action;
		this.depth=depth;
		this.start=0;
		this.end=0;
		this.from=addr.from;    
		this.till=addr.till||-1; //-1 to the end
		this.res=[];
		this.text='';
		this.diggable=false;
		this.ptkname=addr.ptkname;
	}
	run(){

	}
	lineOf(idx:number){
		return this.start+idx;
	}
	getLines(){
		const out=[];
		let till=this.till;
		if (till==-1) till=this.from+ACTIONPAGESIZE; //show partial content if not mention till
		for (let i=this.from;i<till;i++) {
			const line=this.lineOf(i);
			if (line<this.start || line>=this.end) continue;
			out.push(line);
		}
		return out;
	}
	static parse(action:string){
		return parseQuery(action)
	}
}
class FullTextAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
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
	run(){
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
		this.diggable=true;
	}
	run(){
		const ptk=usePtk(this.ptkname);
		[this.start,this.end]=ptk.rangeOfAddress(this.eleid);
	}
}

export const createAction=(addr, depth=0)=>{
	const at=addr.action.indexOf('=');
	if (at>0) {
		if (addr.action.slice(0,at)=='*') {
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