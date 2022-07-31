import {parseAddress,parseElementId,sameAddress,IAddress,usePtk} from '../basket/index.ts';
import {parseQuery} from '../fts/criteria.ts';
import {IAction} from './interfaces.ts';
const MAXITEM=100;
const PAGESIZE=10;
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
		if (till==-1) till=this.from+PAGESIZE;
		till=Math.min(till,this.from+PAGESIZE);
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
			const keys=ptk.primarykeys[name];
			if (!keys) continue;
			let matcher=keys.enumMiddle;
			let enummode=1;
			if (tofind[0]=='^') {
				enummode=0;
				matcher=keys.enumStart;
				tofind=tofind.slice(1);
			} else if (tofind[tofind.length-1]=='$') { //regular expression style
				enummode=2;
				matcher=keys.enumEnd;
				tofind=tofind.slice(0,tofind.length-1);
			}
			const items=matcher.call(keys,tofind);
			const tagname=ptk.attributes.chunktag||'ck';
			const chunker=ptk.defines[tagname];
			const idfield = chunker.fields.id; //TODO sorted ID
			this.end=1;
			this.till=1;
			const caption=ptk.columns[name]?.caption;
			this.ownerdraw={painter:'queryresult',
			 data:{name,enummode, caption,ptkname:this.ptkname,tagname,tofind, items, keys}} ;
		}
	}
}

class RangeAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.eleid=this.action;
	}
	run(){
		const ptk=usePtk(this.ptkname);
		[this.start,this.end]=ptk.rangeOfAddress(this.eleid);
	}
}

export const createAction=(address:string,ctx)=> {
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

	if (addr.action.indexOf('=')>0) {
		return new QueryAction(addr, ctx.depth);
	} else {
		return new RangeAction(addr,ctx.depth);
	}
}