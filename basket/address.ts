import {ILineRange} from '../linebase/index.ts'
import {AT_ELE_ID,AT_ELE_ID_LEFTRIGHT,AT_ELE_ID_LEFTBOUND,AT_ELE_ID_RIGHTBOUND} from '../offtext/index.ts'

export function parseAddress(address:string):[left,right,eleid]{
	let m0,ele,id, left=0 ,right=0 ; //left bound and right bound
	let m=address.match(AT_ELE_ID_LEFTRIGHT);
	if (m) {
		[m0, ele, id, left ,right] = m;
	} else {
		m=address.match(AT_ELE_ID_LEFTBOUND);
		if (m) {
			[m0, ele, id, left] = m;
		} else {
			m=address.match(AT_ELE_ID_RIGHTBOUND);
			if (m) {
				[m0, ele, id, right] = m;
			} else {
				m=address.match(AT_ELE_ID);
				if (m) {
					[m0, ele, id] = m;
				}
			}
		}
	}	
	if (!m) return[];

	const eleid=parseInt(id)?ele+id:ele+'#'+id;
	left=Math.abs(parseInt(left)); right=Math.abs(parseInt(right));
	return [left,right,eleid,ele,id];
}
export function rangeOfAddress(address:string):ILineRange{
	const [left,right,eleid,ele,id] = parseAddress(address);
	
	if (eleid) {	
		const idtype=this.defines[ele].validators.id;
		const _id=(idtype.type=='number')?parseInt(id):id;
		let at=idtype.values.indexOf(_id);
		let first=this.defines[ele].linepos[at] || this.defines[ele].linepos[0] ;
		let last=this.defines[ele].linepos[at+1] || this.defines[ele].linepos[0] ;
		let start=first+(left?left:0);
		let end=right?first+right : last;

		if (start>last) start=last;
		if (end>last) end=last;
		
		const r=[start , end , eleid ];
		return r;
	}
	else return [0,0];
}