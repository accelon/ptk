import {parseLisp,LispToken} from './lisp.ts';
import {parseAddress,parseElementId,sameAddress} from '../basket/index.ts';
import {ILineViewAddress} from './interfaces.ts'
import {ILineRange} from '../linebase/index.ts'
import {load} from './loadline.ts'
import {parseQuery} from '../fts/criteria.ts'
export class LVA {
	constructor (addresses=''){
		this._nodes=LVA.parse(addresses);
		this.load=load;
	}
	nodes(){
		return this._nodes;
	}
	getNode(idx:number){
		return this._nodes[idx];
	}
	remove(idx:number){
		if (typeof idx!=='number') {
			idx=this._nodes.indexOf(idx);
		}
		if (!this._nodes.length) return;
		if (this._nodes.length==1) {
			this._nodes=[];
		}
		const depth=this._nodes[idx].depth;
		let next=idx+1;
		let nextdepth=this._nodes[next].depth;
		while (next<this._nodes.length && nextdepth>depth) {
			next++;
			nextdepth=this._nodes[next].depth;
		}
		if (next-idx>1) { //delete all child
			this._nodes.splice(idx+1,next-idx);
			this._combine();
		}
		this._nodes.splice(idx,1);
		this._combine();
		return this;
	}
	static stringify(lvnode,hideptkname=false, hideaction=false){
	 	const {depth,action,from,till,host} = lvnode;
	 	return ( (host&&(!action || !hideptkname)) ?host+':':'')
	 			+(hideaction?'':action)+(from?':'+from:'')+(till?'<'+till:'');
	}
	stringify(lvnode:number|Map,hideptkname=false,hideaction=false) {

		if (typeof lvnode=='number') lvnode=this.nodes(lvnode);
		if (!lvnode) return this.serialize();
		return LVA.stringify(lvnode,hideptkname,hideaction);
	}
	serialize(){
		if (!this._nodes&&!this._nodes.length) return '';
		let prevdepth=0,same_level_host='',activehost;
		const firstdepth=this._nodes[0].depth;
		const out=[],hosts=[],actions=[] ;
		for (let i=0;i<this._nodes.length;i++) {
			const {depth,from,till,host,action} = this._nodes[i];
			if (depth>prevdepth) out.push('(');
			else if (prevdepth>depth) out.push(')')
			if (host) {
				activehost=host;
				hosts[depth]=host;
			}
			activehost= activehost || hosts[depth] || same_level_host;
			out.push(LVA.stringify(this._nodes[i] , activehost==same_level_host, action==actions[depth] ))
			if (action) actions[depth]=action;
			same_level_host=activehost;
			prevdepth=depth;
		}
		while (prevdepth>firstdepth) {
			prevdepth--;
			out.push(')')
		}
		return out.join('+').replace(/\+?([\(\)])\+?/g,'$1').replace(/\++/g,'+');
	}
	dig(insert:string,idx=0,nline=0){ 
		if (!this._nodes||!this._nodes.length) return;
		let depth=this._nodes[idx].depth;
		if (this._nodes.length>1 && idx<this._nodes.length-1  //reuse children
			&& this._nodes[idx+1].depth==depth+1) {
			const newaddr=parseAddress(insert);
			if (!newaddr) return addresses;
			let p=idx+1;
			while (p<this._nodes.length && this._nodes[p].depth>depth) {
				if (sameAddress(this._nodes[p],newaddr) && newaddr.action) {
					this._nodes.splice(p,1);//remove same
					if (p==idx+1) {
						this._combine();
						return this; //toggle
					}
					break;                //bring to top
				}
				p++;
			}
			newaddr.depth=this._nodes[idx].depth+1;
			this._nodes.splice(idx+1,0,newaddr);
			return this;
		}

		const addr=this._nodes[idx];
		const splitat=addr.from+nline;
		let breakleft,breakright;
		if (addr.from && addr.till && addr.till==addr.from) { //one line only, no breakright
			breakleft=addr;
		} else {
			breakleft=Object.assign({},addr, {till:splitat+1});
			breakright=Object.assign({},addr, {from:splitat+1});
		}
		const toinsert=parseAddress(insert);
		toinsert.depth= breakleft.depth+1;
		const out=[ breakleft,  toinsert];
		if (breakright) out.push(breakright);
		this._nodes.splice(idx,1,...out);
		return this;
	}
	_combine(){
		const out=[];
		let i=0;
		while (i< this._nodes.length) {
			const {host,from,till,action,depth}=this._nodes[i];
			let next=this._nodes[i+1];
			out.push(this._nodes[i]);
			while (i<this._nodes.length && next && next.host==host && next.action==action 
				&& next.depth == depth && next.from == till) {
				this._nodes[i].till=next.till;
				i++
				next=this._nodes[i+1];
			} 
			i++;
		}
		this._nodes=out;
		return this;
	}
	static parse(addresses){
		if (!addresses) return [];
		const expr=parseLisp(addresses);
		let same_level_host='', same_level_action='',hosts=[] , actions=[] ;
		const nodes=expr.map( ([depth,address])=>{  
			const addr=parseAddress(address);
			if (!addr) return null;

			const [ele,id]=parseElementId(addr.action);
			if (addr.action) actions[depth]=addr.action;
			if (addr.host)  hosts[depth]=addr.host;
			addr.action= addr.action || actions[depth] || same_level_action;
			addr.host= addr.host || hosts[depth] || same_level_host;
			same_level_host=addr.host;
			same_level_action=addr.action;
			if (addr.from && addr.till&& addr.till<addr.from) addr.till=addr.from;
			let criteria;
			if (addr.action.indexOf('=')>0) criteria=parseQuery(addr.action);
			return {depth, ...addr, criteria}
		}).filter(it=>!!it);
		return nodes;
	}
}