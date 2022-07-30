import {ILineRange} from '../linebase/index.ts'
import {PTK_ACTION_FROMTILL,PTK_FROMTILL,FROMTILL} from '../offtext/index.ts'

export interface IAddress {
	ptkname:string,
	action:string,
	from:number,
	till:number,
}
export const parseElementId=(action:string)=>{
	const m=action.match(/([a-z_])+#?([a-z\d_-]+)/);
	return m?[m[1],m[2]]:[];
}
export const sameAddress=(addr1,addr2)=>{
	if (typeof addr1=='string') addr1=parseAddress(addr1);
	if (typeof addr2=='string') addr2=parseAddress(addr2);
	if (!addr1||!addr2) return;
	return addr1.action==addr2.action && addr1.ptkname ==addr2.ptkname;
}
export const makeAddress=(ptkname='',action='',from=0,till=0)=>{
	return (ptkname?ptkname+':':'')+action+(from?':'+from:'')+(till?'<'+till:'');
}
export const parseAddress=(address:string):IAddress=>{
	let m0,basket='',action='', from=0 ,till=0 ; //left bound and right bound
	let m=address.match(PTK_ACTION_FROMTILL);
	if (m) {
		[m0, ptkname, action, from , till] = m;
	} else {
		m=address.match(PTK_FROMTILL);
		if (m) {
			[m0, ptkname, from,till] = m;
		} else {
			m=address.match(FROMTILL);
			if (m) [m0,from,till] = m;	
			else return null;
		}
	}
	from=(from||'').slice(1);
	till=(till||'').slice(1);
	ptkname=ptkname||'';
	ptkname=ptkname.slice(0,ptkname.length-1); //remove :

	return {ptkname, action,from:Math.abs(parseInt(from))||0,till:Math.abs(parseInt(till))||0 };
}
export function lineOfElementId(eleid:string){

}
export function rangeOfAddress(address:string):ILineRange{
	const {ptkname,from,till,action} = parseAddress(address);

	const [ele,id]=parseElementId(action);
	if (ele && this.defines[ele]) {
		const idtype=this.defines[ele].fields.id;
		const _id=(idtype.type=='number')?parseInt(id):id;
		let at=idtype.values.indexOf(_id);
		let first=this.defines[ele].linepos[at] || this.defines[ele].linepos[0] ;
		let last=this.defines[ele].linepos[at+1] || this.defines[ele].linepos[0] ;
		let start=first+ (from||0 ) ;
		let end=till?first+till : last;

		if (start>last) start=last;
		if (end>last) end=last;
		
		const r=[start , end];
		return r;
	} else {
		return [from,(till?till:from+1)]; //數字型不知道終點，預設取一行
	}
}