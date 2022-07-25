import {parseAddress} from '../basket/index.ts';
import {parseLisp,LispToken} from './lisp.ts';
import {ILineRange} from '../linebase/index.ts'

export interface ILineViewAddress {
	depth: number,
	host : string,
	ele  : string,
	id   : string,
	from : number,
	till : number,
}
export const parseLVA = (addresses:string):ILineViewAddress[]=>{
	if (!addresses) return [];
	const expr=parseLisp(addresses);
	let same_level_host='', hosts=[];
	let lva=expr.map( ([depth,address])=>{  
		const addr=parseAddress(address);
		if (!addr) {
			return null;
		}
		if (addr.host) {
			host=addr.host;
			hosts[depth]=addr.host;
		}
		addr.host= addr.host || hosts[depth] || same_level_host;
		same_level_host=addr.host;
		if (addr.from && addr.till&& addr.till<addr.from) addr.till=addr.from;
		return {depth, ...addr }
	}).filter(it=>!!it);
	return lva;
}

export const stringifyLVA= (lva:ILineViewAddress|ILineViewAddress[] , hideptkname=false)=>{
	if (!lva) return '';
	if (Array.isArray(lva)&&lva.length) {
		let prevdepth=0,same_level_host='',activehost;
		const firstdepth=lva[0].depth;
		const out=[],hosts=[] ;
		for (let i=0;i<lva.length;i++) {
			const {depth,ele,from,till,id,host} = lva[i];
			if (depth>prevdepth) out.push('(');
			else if (prevdepth>depth) out.push(')')
			if (host) {
				activehost=host;
				hosts[depth]=host;
			}
			activehost= activehost || hosts[depth] || same_level_host;
			out.push(stringifyLVA(lva[i] , activehost==same_level_host))
			same_level_host=activehost;
			prevdepth=depth;
		}
		while (prevdepth>firstdepth) {
			prevdepth--;
			out.push(')')
		}
		return out.join('+').replace(/\+?([\(\)])\+?/g,'$1');
	}
 	const {depth,ele,from,till,id,host} = lva;
 	const numeric=parseInt(id).toString()==id;
 	return ( (host&&(!ele  || !hideptkname)) ?host+':':'')
 			+(ele?ele+(numeric?'':'#')+id:'')
 			+(from?':'+from:'')+(till?'<'+till:'');
 }

export const digLVA=(addresses:string, insert:string, pos=0):ILineViewAddress[]=>{
	const lva=parseLVA(addresses);
	if (!lva || !lva.length) return;
	if (lva.length>1 && lva[1].depth==lva[0].depth+1) { //reuse children
		const newaddr=parseAddress(insert)
		if (!newaddr) return addresses;
		newaddr.depth=lva[0].depth+1;
		lva.splice(1,0,newaddr);
		return stringifyLVA(lva)
	}
	const addr=lva[pos];
	const splitat=addr.from+pos;
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
	const digged=stringifyLVA(out);
	return digged;
}

export const combineLVA=(addresses:string):ILineViewAddress=>{
	const lvas=typeof addresses=='string'?parseLVA(addresses):addresses;
	const out=[];
	let i=0;
	while (i< lvas.length) {
		const {host,from,till,id,ele}=lvas[i];
		let next=lvas[i+1];
		out.push(lvas[i]);
		while (i<lvas.length && next && next.host==host && next.ele==ele && next.id==id && next.from == till) {
			lvas[i].till=next.till;
			i++
			next=lvas[i+1];
		} 
		i++;
	}
	return stringifyLVA(out);
}
export const undigLVA=(addresses:string, pos=0):ILineViewAddress=>{
	const lvas=parseLVA(addresses);
	if (!lvas || !lvas.length) return null;
	if (lvas.length==1) return lvas[0];
	if (lvas.length==2) return lvas[0];
	if (pos<1) pos=1;
	let p=pos;

	const L=lvas[p-1];
	let R=lvas[p];
	while (p<lvas.length && R.depth>L.depth) {
		p++;
		R=lvas[p];
	}
	lvas.splice(pos, p-pos );
	R=lvas[pos];

	if (L.till===R.from&&L.host===R.host&&L.ele===R.ele&&L.id===R.id&&L.depth===R.depth) {
		const combined=Object.assign({},R,{from:L.from});
		lvas.splice(0,2,combined);
	}
	return stringifyLVA(lvas);
}