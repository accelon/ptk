import {parseAddress,sameAddress} from '../basket/index.ts'
import {parseLisp,LispToken} from './lisp.ts';
import {ILineViewAddress} from './interfaces.ts';
import {ILineRange} from '../linebase/index.ts';
import {load} from './loadline.ts';
import {createAction} from './action.ts';
export class LVA {
	constructor (addresses=''){
		this._divisions=LVA.parse(addresses);
		this.load=load;
	}
	divisions(){
		return this._divisions;
	}
	getNode(idx:number){
		return this._divisions[idx];
	}
	remove(idx:number){
		if (typeof idx!=='number') {
			idx=this._divisions.indexOf(idx);
		}
		if (!this._divisions.length) return;
		if (this._divisions.length==1) {
			this._divisions=[];
		}
		const depth=this._divisions[idx].depth;
		let next=idx+1;
		let nextdepth=this._divisions[next].depth;
		while (next<this._divisions.length && nextdepth>depth) {
			next++;
			nextdepth=this._divisions[next].depth;
		}
		if (next-idx>1) { //delete all child
			this._divisions.splice(idx+1,next-idx);
			this._combine();
		}
		this._divisions.splice(idx,1);
		this._combine();
		return this;
	}
	static stringify(lvnode,hideptkname=false, hideaction=false){
	 	const {depth,action,from,till,ptkname,end} = lvnode;
	 	return ( (ptkname&&(!action || !hideptkname)) ?ptkname+':':'')
	 			+(hideaction?'':action)+(from?':'+from:'')+(till>0&&till&&till<end?'<'+till:'');
	}
	stringify(lvnode:number|Map,hideptkname=false,hideaction=false) {
		if (typeof lvnode=='number') lvnode=this.divisions(lvnode);
		if (!lvnode) return this.serialize();
		return LVA.stringify(lvnode,hideptkname,hideaction);
	}
	serialize(){
		if (!this._divisions&&!this._divisions.length) return '';
		let prevdepth=0,same_level_ptkname='',activeptkname;
		const firstdepth=this._divisions[0].depth;
		const out=[],ptknames=[],actions=[] ;
		for (let i=0;i<this._divisions.length;i++) {
			const {depth,from,till,ptkname,action} = this._divisions[i];
			if (depth>prevdepth) out.push('(');
			else if (prevdepth>depth) out.push(')')
			if (ptkname) {
				activeptkname=ptkname;
				ptknames[depth]=ptkname;
			}
			activeptkname= activeptkname || ptknames[depth] || same_level_ptkname;
			out.push(LVA.stringify(this._divisions[i] , activeptkname==same_level_ptkname, action==actions[depth] ))
			if (action) actions[depth]=action;
			same_level_ptkname=activeptkname;
			prevdepth=depth;
		}
		while (prevdepth>firstdepth) {
			prevdepth--;
			out.push(')')
		}
		return out.join('+').replace(/\+?([\(\)])\+?/g,'$1').replace(/\++/g,'+');
	}
	dig(insert:string,idx=0,nline=0){ 
		if (!this._divisions||!this._divisions.length) return;
		let depth=this._divisions[idx].depth;
		if (this._divisions.length>1 && idx<this._divisions.length-1  //reuse children
			&& this._divisions[idx+1].depth==depth+1) {
			const newaddr=parseAddress(insert);
			if (!newaddr) return addresses;
			let p=idx+1;
			while (p<this._divisions.length && this._divisions[p].depth>depth) {
				if (sameAddress(this._divisions[p],newaddr) && newaddr.action) {
					this._divisions.splice(p,1);//remove same
					if (p==idx+1) {
						this._combine();
						return this; //toggle
					}
					break;                //bring to top
				}
				p++;
			}
			newaddr.depth=this._divisions[idx].depth+1;
			this._divisions.splice(idx+1,0,newaddr);
			return this;
		}
		const addr=this._divisions[idx];
		const splitat=addr.from+nline;
		let breakleft,breakright;
		if ((addr.from && addr.till && addr.till==addr.from) || splitat+1>=addr.end) { //one line only, no breakright
			breakleft=addr;
		} else {
			breakleft=Object.assign({},addr, {till:splitat+1});
			breakright=Object.assign({},addr, {from:splitat+1});
		}
		const toinsert=parseAddress(insert);
		toinsert.depth= breakleft.depth+1;
		const out=[ breakleft,  toinsert];
		if (breakright) out.push(breakright);
		this._divisions.splice(idx,1,...out);
		return this;
	}
	_combine(){
		const out=[];
		let i=0;
		while (i< this._divisions.length) {
			const {ptkname,from,till,action,depth}=this._divisions[i];
			let next=this._divisions[i+1];
			out.push(this._divisions[i]);
			while (i<this._divisions.length && next && next.ptkname==ptkname && next.action==action 
				&& next.depth == depth && next.from == till) {
				this._divisions[i].till=next.till;
				i++
				next=this._divisions[i+1];
			} 
			i++;
		}
		this._divisions=out;
		return this;
	}
	static parse(addresses){
		if (!addresses) return [];
		const expr=parseLisp(addresses);
		const ctx={same_level_ptkname:'', same_level_action:'',ptknames:[] , actions:[]} ;
		const divisions=expr.map( ([depth,action])=>{
			ctx.depth=depth;
			return createAction(action,ctx);
		}).filter(it=>!!it);
		return divisions;
	}
}