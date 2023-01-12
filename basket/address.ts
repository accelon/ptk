import {ILineRange} from '../linebase/index.ts';
import {bsearchNumber} from '../utils/index.ts';
import {ACTIONPAGESIZE} from "../lineview/interfaces.ts";
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
		const m1=branches[i].match(/([a-z_\-]+)#([a-z\d_-]+)/); // with # id
		const m2=branches[i].match(/([a-z_\-]+)(\d+[a-z\d_-]+)/);  // with number prefix mix id
		const m3=branches[i].match(/([a-z_\-]+)(\d*)/);  // with pure number id
		if (m1) {
			out.push([m1[1],m1[2]]);
		} else if (m2) {
			out.push([m2[1],m2[2]]);
		} else if (m3) {
			out.push([m3[1],m3[2]]);
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

	return (ptkname?ptkname+':':'')+action+(from?'>'+from:'')+(till?'<'+till:'')+(lineoff>0?':'+lineoff:'');
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
	
	if (!from && !till && highlightline) {
		if (highlightline>ACTIONPAGESIZE) {
			from=highlightline- Math.floor(ACTIONPAGESIZE/2);
			till=from+ACTIONPAGESIZE;			
		}
	} 
	
	ptkname=ptkname||'';
	ptkname=ptkname.slice(0,ptkname.length-1); //remove :
	return {ptkname, action,from:Math.abs(parseInt(from))||0,till:Math.abs(parseInt(till))||0
		 , highlightline:Math.abs(parseInt(highlightline))||-1};
}

export function rangeOfElementId(eleid:string){
	const out=[], ptk=this;
	let from=0;
	for (let i=0;i<eleid.length;i++) {
		const [ele,id]=eleid[i];
		if (ptk.defines[ele]) {
			const idtype=ptk.defines[ele].fields?.id;
			const _id=(idtype?.type=='number')?parseInt(id):id;
			const startfrom=bsearchNumber(ptk.defines[ele].linepos, from);
			const at=idtype.values.indexOf(_id,startfrom);
			const first=ptk.defines[ele].linepos[at] || ptk.defines[ele].linepos[0] ;
			const last=ptk.defines[ele].linepos[at+1] || ptk.header.eot ;
			from=first;
			out.push([first,last]);
		} else {
			//try book id first, then artbulk id
			const at=ptk.defines.bk?.fields.id.values.indexOf(ele);
			const at2=at==-1?ptk.defines.ak?.fields.id.values.indexOf(ele):-1;

			if (i==0 && (~at||~at2) ) {
				const first=ptk.defines.bk.linepos[at]||ptk.defines.ak.linepos[at2];
				let last=ptk.defines.bk.linepos[at+1]||ptk.defines.ak.linepos[at2+1];
				if (!last) last=ptk.header.eot;
				out.push([first,last]);
				from=first;
			}
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
//only display the first level
export function captionOfAddress(address:string):string{
	let addr=address;
	if (typeof address=='string') {
		addr=parseAddress(address);
	}
	const {action} = addr;
	const defines=this.defines;
	const eleidarr=parseAction(action);
	const out=[];
	for (let i=0;i<eleidarr.length;i++) {
		const [ele,id]=eleidarr[i];
		if (!defines[ele] || !defines[ele].fields.id) return '';
		const at=defines[ele].fields.id.values.indexOf(id);
		out.push(defines[ele]?.innertext?.get(at));
	}
	return out.join('/');
}

export function makeElementId(ele,id:string):string{
	return ele+( (parseInt(id).toString()==id)?'':'#')+id;
}
export function makeChunkAddress(ck,id:string,lineoff=0):string{
	const scrollto= lineoff?((lineoff>=5)?('>'+(lineoff-1)):'') +(lineoff?':'+lineoff:''):'';	

	return 'bk'+((parseInt(ck.bk?.id).toString()==ck.bk?.id)?'':'#')+ck.bk?.id
	 +'.ck'+((parseInt(ck.id).toString()==ck.id)?'':'#')+(id||ck.id)
	 + scrollto;
}