import {parseAddress,parseElementId,sameAddress,IAddress,usePtk} from '../basket/index.ts';
import {parseQuery} from '../fts/criteria.ts';
import {IAction} from './interfaces.ts';
const MAXITEM=100;
const PAGESIZE=10;
export class Action implements IAction{
	constructor (addr:IAddress,depth=0) {
		this.action=Action.parse(addr.action);
		this.depth=depth;
		this.from=addr.from;    
		this.till=addr.till;
		this.ptkname=addr.host; //parse the ptk
	}
	run(){

	}
	lineOf(idx:number){
		return idx;
	}
	getLines(){
		const out=[];
		const till=Math.min(this.till,this.from+PAGESIZE);
		for (let i=this.from;i<till;i++) {
			out.push(this.lineOf(i));
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
	run(){
		const ptk=usePtk(this.ptkname);
		for (let i=0;i<this.action.length;i++) {
			const {name,tofind}=this.action[i];
			const keys=ptk.primarykeys[name];
			if (!keys) continue;
			const matches=keys.enumStart(tofind);
			const chunker=ptk.defines[ptk.chunktag];
			const idfield = chunker.fields.id; //TODO sorted ID
			
			this.res=matches.map(chunkid=>{
				const at=idfield.find(chunkid);
				return { chunkid , title:keys.get(chunkid), line:chunker.linepos[at]||-1 } 
			});
			console.log(this.res)
		}
	}
}

class RangeAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.eleid=this.action;
	}
	run(){

	}
}

export const createAction=(address:string,ctx)=> {
	const addr=parseAddress(address);
	if (!addr) return null;
	//補足文字型可省略的信息
	if (addr.action) ctx.actions[ctx.depth]=addr.action;
	if (addr.host)  ctx.hosts[ctx.depth]=addr.host;
	addr.action= addr.action || ctx.actions[ctx.depth] || ctx.same_level_action;
	addr.host= addr.host || ctx.hosts[ctx.depth] || ctx.same_level_host;
	ctx.same_level_host=addr.host;
	ctx.same_level_action=addr.action;
	if (addr.from && addr.till&& addr.till<addr.from) addr.till=addr.from;

	if (addr.action.indexOf('=')>0) {
		return new QueryAction(addr, ctx.depth);
	} else {
		return new RangeAction(addr,ctx.depth);
	}
}