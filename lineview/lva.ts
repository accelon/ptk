import {parseAddress,sameAddress} from '../basket/index.ts'
import {parseLisp,LispToken} from './lisp.ts';
import {ILineViewAddress} from './interfaces.ts';
import {ILineRange} from '../linebase/index.ts';
import {load} from './loadline.ts';
import {createAction,createNestingAction,ACTIONPAGESIZE} from './action.ts';

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
			return this;
		}
		const depth=this._divisions[idx].depth;
		let next=idx+1;
		let nextdepth=this._divisions[next]?.depth;
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
	 	const {depth,action,from,till,highlightline,ptkname} = lvnode;
	 	return ( (ptkname&&(!action || !hideptkname)) ?ptkname+':':'')
	 			+(hideaction?'':action)+(from?':'+from:'')+(till>0?'<'+till:'')
	 			+(highlightline>-1?'>'+highlightline:'');
	}
	stringify(lvnode:number|Map,hideptkname=false,hideaction=false) {
		if (typeof lvnode=='number') lvnode=this.divisions(lvnode);
		if (!lvnode) return this.serialize();
		return LVA.stringify(lvnode,hideptkname,hideaction);
	}
	firstChild(idx:number){
		if (idx<this._divisions.length-1) return ;
		const firstchild=this._divisions[idx+1];
		if (firstchild && firstchild.depth==this._divisions[idx].depth+1) {
			return firstchild;
		}
	}
	serialize(){
		if (!this._divisions&&!this._divisions.length) return '';
		let prevdepth=0,same_level_ptkname='',activeptkname;
		const firstdepth=this._divisions[0]?.depth||0;
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
	removeSameAction(newaddr,from=0,depth=-1){
		let p=from;
		while (p<this._divisions.length && this._divisions[p].depth>depth) {
			if (sameAddress(this._divisions[p],newaddr) && newaddr.action) {
				this._divisions.splice(p,1);//remove same
				return p;
				break;                //bring to top
			}
			p++;
		}
		return -1;
	}
	canless(idx){
		const division=this._divisions[idx];
		if (!division) return;
		return division.till-division.from>ACTIONPAGESIZE;
	}
	less(idx){
		const division=this._divisions[idx];
		if (!division) return;

		division.till-=ACTIONPAGESIZE;
		if (division.till-ACTIONPAGESIZE<division.from) division.till=division.from+ACTIONPAGESIZE;
		return this;
	}
	more(idx){
		const division=this._divisions[idx];
		if (!division) return;
		const linecount=division.last-division.first;
		const till=division.till;
		if (till==-1) division.till=division.from+ACTIONPAGESIZE;
		else division.till+=ACTIONPAGESIZE;
		if (division.till>linecount) division.till=linecount;
		return this;
	}
	getViewPageSize(division){ //return the 
		let pagesize=division.till-division.from;
		const linecount=division.last-division.first;
		if (pagesize<ACTIONPAGESIZE) {
			pagesize=ACTIONPAGESIZE;
			if (pagesize > linecount) {
				pagesize=division.last-division.first;
			}
		}
		return pagesize;
	}
	next(idx){
		const division=this._divisions[idx];
		if (!division) return;
		const linecount=division.last-division.first;
		const pagesize=this.getViewPageSize(division);
		division.from=division.till-1;
		if (division.from<0)division.from=0;
		division.till=division.from+pagesize;
		if (division.from+1>linecount) division.from=linecount-1;
		if (division.till>linecount) division.till=linecount;
		return this;
	}
	prev(idx){
		const division=this._divisions[idx];
		if (!division) return;
		const pagesize=this.getViewPageSize(division);
		division.from-=pagesize-1;
		if (division.from<0) division.from=0;
		division.till= division.from+pagesize;
		return this;
	}
	top(idx){
		const division=this._divisions[idx];
		if (!division) return;
		const pagesize=division.till-division.from;
		division.from=0;
		division.till=pagesize;
		return this;
	}
	setFrom(idx,from){
		const division=this._divisions[idx];
		if (!division) return;
		
		division.from=from;
		if (division.till!==-1) division.till=division.from+ACTIONPAGESIZE;
		if (division.till>division.last-division.first) division.till=division.last-division.first;

		return this;
	}
	insert(addr:string,idx=0) {
		const newaddr=parseAddress(addr);
		if (!newaddr) return this;
		//to pass the same address check
		newaddr.ptkname=newaddr.ptkname||this._divisions[idx]?.ptkname||this._divisions[idx-1]?.ptkname;
		const removeat=this.removeSameAction(newaddr);
		if (removeat>-1) { // move to top
			if (removeat!==idx) this._divisions.splice(idx,0,newaddr);
		} else { //new addr , just append at the end
			this._divisions.splice(idx,0,newaddr);
		}
		return this;
	}
	dig(digaddr:string,idx=0,nline=0){ 
		const newaddr=parseAddress(digaddr);
		if (!newaddr) return this;
		newaddr.ptkname=newaddr.ptkname||this._divisions[idx].ptkname;
		const newaction=createAction(newaddr,0);
		if ( !this._divisions||!this._divisions.length) {
			this._divisions.push(newaddr);
			return this;
		}

		if (sameAddress(this._divisions[idx],newaddr)) return this; //prevent recursive dig

		if (!newaction.diggable) { //
			const removeat=this.removeSameAction(newaddr);
			if (removeat==-1 || removeat>idx) { //bring to top
				this._divisions.splice(idx,0,newaddr);
			}
			return;
		}
		let depth=this._divisions[idx].depth;
		if (this._divisions.length>1 && idx<this._divisions.length-1  //reuse children
			&& this._divisions[idx+1].depth==depth+1) {
			const removeat=this.removeSameAction(newaddr,idx+1,depth);
			if (~removeat&& idx+1==removeat) { //remove the first child
				this._combine();
				return this;
			}
			newaddr.depth=this._divisions[idx].depth+1;
			this._divisions.splice(idx+1,0,newaddr);
			return this;
		}
		const addr=this._divisions[idx];
		const splitat=addr.from+nline;
		let breakleft,breakright;
		const toinsert=parseAddress(digaddr);

		if ((addr.from && addr.till && addr.till==addr.from) || splitat+1>=(addr.last-addr.first)) { //one line only, no breakright
			breakleft=addr;
			if (addr.action==toinsert.action) { //delete
				this._divisions.splice(idx,1);
				return this;
				return;
			}
		} else {
			breakleft=Object.assign({},addr, {till:splitat+1});
			breakright=Object.assign({},addr, {from:splitat+1});
		}
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
			return createNestingAction(action,ctx);
		}).filter(it=>!!it);
		return divisions;
	}
}