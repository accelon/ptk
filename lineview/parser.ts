import {parseAddress} from '../basket/index.ts';
import {parseLisp,LispToken} from './lisp.ts';
import {ILineRange} from '../linebase/index.ts'

export interface ILineViewAddress {
	depth: number,
	host : string,
	ele  : string,
	id   : string,
	left : number,
	right: number,
}
export const parseLVA = (addresses:string):ILineViewAddress[]=>{
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
		if (addr.left && addr.right&& addr.right<addr.left) addr.right=addr.left;
		return {depth, ...addr }
	}).filter(it=>!!it);
	return lva;
}

export const stringifyLVA= (lva:ILineViewAddress|ILineViewAddress[] , hideptkname=false)=>{
	if (!lva) return '';
	if (Array.isArray(lva)) {
		let prevdepth=0,same_level_host='',activehost;
		const out=[],hosts=[] ;
		for (let i=0;i<lva.length;i++) {
			const {depth,ele,left,right,id,host} = lva[i];	
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
		return out.join('+').replace(/\+?([\(\)])\+?/g,'$1');
	}
 	const {depth,ele,left,right,id,host} = lva;
 	const numeric=parseInt(id).toString()==id;
 	return ( (!ele&&host&&!hideptkname) ?host+':':'')
 			+(ele?ele+(numeric?'':'#')+id:'')
 			+(left?'<'+left:'')+(right?'>'+right:'');
 }

export const digLVA=(addresses:string, insert:string, pos=0):ILineViewAddress[]=>{
	const lva=parseLVA(addresses);

	if (lva.length>1 && lva[1].depth==lva[0].depth+1) { //reuse children
		const newaddr=parseAddress(insert)
		newaddr.depth=lva[0].depth+1;
		lva.splice(1,0,newaddr);
		return stringifyLVA(lva)
	}
	const addr=lva[pos];
	const splitat=addr.left+pos;
	let breakleft,breakright;
	if (addr.left && addr.right && addr.right==addr.left) { //one line only, no breakright
		breakleft=addr;
	} else {
		breakleft=Object.assign({},addr, {right:splitat+1});
		breakright=Object.assign({},addr, {left:splitat+1});
	}
	const toinsert=parseAddress(insert);
	toinsert.depth= breakleft.depth+1;
	const out=[ breakleft,  toinsert];
	if (breakright) out.push(breakright);
	const digged=stringifyLVA(out);
	return digged;
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

	if (L.right+1===R.left&&L.host===R.host&&L.ele===R.ele&&L.id===R.id&&L.depth===R.depth) {
		const combined=Object.assign({},R,{left:L.left});
		lvas.splice(0,2,combined);
	}
	return stringifyLVA(lvas);
}