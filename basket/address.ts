import {ILineRange} from '../linebase/index.ts'
import {AT_HOST_ELE_ID_BOUND, AT_HOST_BOUND} from '../offtext/index.ts'
export interface ILVA {
	host:string,
	ele:string,
	id:string,
	left:number,
	right:number,
}
export const parseAddress=(address:string)=>{
	let m0,basket='',ele='',id='', left=0 ,right=0 ; //left bound and right bound
	let m=address.match(AT_HOST_ELE_ID_BOUND);
	if (m) {
		[m0, host, ele, id, left ,right] = m;
	} else {
		m=address.match(AT_HOST_BOUND);
		if (m) {
			[m0, host, left ,right] = m;
		} else return null;
	}
	right=(right||'').slice(1);
	left=(left||'').slice(1);
	host=host||'';
	host=host.slice(0,host.length-1); //remove :

	left=Math.abs(parseInt(left))||0; right=Math.abs(parseInt(right))||0;

	return {host, ele,id,left,right,start:0,end:0};
}
export function rangeOfAddress(address:string):ILineRange{
	const {host,left,right,ele,id} = parseAddress(address);
	if (ele) {
		const idtype=this.defines[ele].validators.id;
		const _id=(idtype.type=='number')?parseInt(id):id;
		let at=idtype.values.indexOf(_id);
		let first=this.defines[ele].linepos[at] || this.defines[ele].linepos[0] ;
		let last=this.defines[ele].linepos[at+1] || this.defines[ele].linepos[0] ;
		let start=first+(left?left:0);
		let end=right?first+right : last;

		if (start>last) start=last;
		if (end>last) end=last;
		
		const r=[start , end  ];
		return r;
	} else {
		return [left,(right?right:left)];
	}
}