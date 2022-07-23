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
const parseRange=(token:[LispToken,string],ptk):ILineRange=>{
	let from,to;
	if (token.type===LispToken.Address) {
		[from,to]=ptk.rangeOfAddress(token.value);	
	}
	return [from,to];
}

export const stringifyLVA= (lva:ILineViewAddress|ILineViewAddress[] )=>{
	if (!lva) return '';
	if (Array.isArray(lva)) {
		return lva.map(stringifyLVA);
	}

 	const {ele,left,right,id,host} = lva;
 	const numeric=parseInt(id).toString()==id;
 	return (host?host+':':'')+ele+(numeric?'':'#')+id+(left?'<'+left:'')+(right?'>'+right:'');
 }

export const splitLVA=(address:string, insert:string, pos=0):ILineViewAddress[]=>{
	const out=[];
	const addr=parseAddress(address);
	const splitat=addr.left+pos+1;
	let breakleft,breakright;
	if (addr.left && addr.right && addr.right==addr.left) { //one line only, no breakright
		breakleft=addr;
	} else {
		breakleft=Object.assign({},addr, {right:splitat});
		breakright=Object.assign({},addr, {left:splitat});
	}
	
	const splitted=stringifyLVA(breakleft)+' ( '+insert+' ) '+ (breakright?stringifyLVA(breakright):'');
	const r=parseLVA(splitted) ;
	return r;
}

export const joinLVA=(lvas:ILineViewAddress[]):ILineViewAddress=>{
	if (!lvas || !lvas.length) return null;
	if (lvas.length==1) return lvas[0];
	
	if (lvas.length==2) return lvas[0];

	const L=lvas[0],R=lvas[lvas.length-1];
	if (L.right===R.left&&L.host===R.host&&L.ele===R.ele&&L.id===R.id&&L.depth===R.depth) {
		return Object.assign({},R,{left:L.left});
	}
	return null;
}