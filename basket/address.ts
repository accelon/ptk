import {ILineRange} from '../linebase/index.ts';
import {bsearchNumber} from '../utils/index.ts';
import {PTK_ACTION_FROMTILL,PTK_FROMTILL,FROMTILL} from '../offtext/index.ts'
export const BRANCH_SEP = '.';
export interface IAddress {
	ptkname:string,
	action:string,
	from:number,
	till:number,
	highlightline:number,
}
export const parseAction=(action:string)=>{
	const branches=action.split(BRANCH_SEP);
	const out=[];
	for (let i=0;i<branches.length;i++) {
		const m=branches[i].match(/([a-z_]+)#?([a-z\d_-]+)/);
		if (m) {
			out.push([m[1],m[2]]);
		}
	}
	return out;
}
export const sameAddress=(addr1,addr2)=>{
	if (typeof addr1=='string') addr1=parseAddress(addr1);
	if (typeof addr2=='string') addr2=parseAddress(addr2);
	if (!addr1||!addr2) return;
	return addr1.action==addr2.action && addr1.ptkname ==addr2.ptkname;
}
export const makeAddress=(ptkname='',action='',from=0,till=0,lineoff=-1)=>{
	//lineoff >0 , highlight highlightline
	return (ptkname?ptkname+':':'')+action+(from?':'+from:'')+(till?'<'+till:'')+(lineoff>0?'>'+lineoff:'');
}
export const parseAddress=(address:string):IAddress=>{
	let m0,ptkname='',action='', from='' ,till='', highlightline='' ; //left bound and right bound
	let m=address.match(PTK_ACTION_FROMTILL);
	if (m) {
		[m0, ptkname, action, from , till, highlightline ] = m;
	} else {
		m=address.match(PTK_FROMTILL);
		if (m) {
			[m0, ptkname, from,till ,highlightline] = m;
		} else {
			m=address.match(FROMTILL);
			if (m) [m0,from,till, highlightline] = m;	
			else return null;
		}
	}
	from=(from||'').slice(1);
	till=(till||'').slice(1);
	highlightline=(highlightline||'').slice(1);
	ptkname=ptkname||'';
	ptkname=ptkname.slice(0,ptkname.length-1); //remove :
	return {ptkname, action,from:Math.abs(parseInt(from))||0,till:Math.abs(parseInt(till))||0
		 , highlightline:Math.abs(parseInt(highlightline))||-1};
}

export function rangeOfElementId(eleid){
	const out=[];
	let from=0;
	for (let i=0;i<eleid.length;i++) {
		const [ele,id]=eleid[i];
		if (this.defines[ele]) {
			const idtype=this.defines[ele].fields?.id;
			const _id=(idtype?.type=='number')?parseInt(id):id;
			const startfrom=bsearchNumber(this.defines[ele].linepos, from);
			const at=idtype.values.indexOf(_id,startfrom);
			const first=this.defines[ele].linepos[at] || this.defines[ele].linepos[0] ;
			const last=this.defines[ele].linepos[at+1] || this.header.eot ;
			from=first;
			out.push([first,last]);
		} else {
			out.push([0,0]);
		}
	}
	return out;
}
export function rangeOfAddress(address:string|IAddress):ILineRange{
	let addr=address;
	if (typeof address=='string') {
		addr=parseAddress(address);
	}
	const {ptkname,from,till,action} = addr;
	const eleid=parseAction(action);
	const ranges=rangeOfElementId.call(this,eleid);
	if (ranges.length) {
		const [first,last]=ranges[ranges.length-1] ; 
		return [first,last];
	} else {
		const end=(till?till:from+1);
		return [0,end ]; //數字型不知道終點，預設取一行
	}
}