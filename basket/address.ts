import {ILineRange} from '../linebase/index.ts'
import {AT_HOST_ELE_ID_BOUND, AT_HOST_BOUND} from '../offtext/index.ts'
export interface ILVA {
	host:string,
	ele:string,
	id:string,
	from:number,
	till:number,
}
export const parseAddress=(address:string)=>{
	let m0,basket='',ele='',id='', from=0 ,till=0 ; //left bound and right bound
	let m=address.match(AT_HOST_ELE_ID_BOUND);
	if (m) {
		[m0, host, ele, id, from , till] = m;
	} else {
		m=address.match(AT_HOST_BOUND);
		if (m) {
			[m0, host, from,till] = m;
		} else return null;
	}
	from=(from||'').slice(1);
	till=(till||'').slice(1);
	host=host||'';
	host=host.slice(0,host.length-1); //remove :

	return {host, ele,id,from:Math.abs(parseInt(from))||0,till:Math.abs(parseInt(till))||0 };
}
export function rangeOfAddress(address:string):ILineRange{
	const {host,from,till,ele,id} = parseAddress(address);
	if (ele && this.defines[ele]) {
		const idtype=this.defines[ele].validators.id;
		const _id=(idtype.type=='number')?parseInt(id):id;
		let at=idtype.values.indexOf(_id);
		let first=this.defines[ele].linepos[at] || this.defines[ele].linepos[0] ;
		let last=this.defines[ele].linepos[at+1] || this.defines[ele].linepos[0] ;
		let start=first+ (from||0 ) ;
		let end=till?first+till : last;

		if (start>last) start=last;
		if (end>last) end=last;
		
		const r=[start , end ];
		return r;
	} else {
		return [from,(till?till:from+1)]; //數字型不知道終點，預設取一行
	}
}