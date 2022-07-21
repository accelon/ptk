import {ILineRange} from '../linebase/index.ts'
import {ADDRESS_ELE_ID_RANGE,ADDRESS_ELE_ID,ADDRESS_ELE_ID_FROM,ADDRESS_ELE_ID_TO} from '../offtext/index.ts'
export function parseAddress(address:string):ILineRange{
	let m0,ele,id, from ,to ;
	let m=address.match(ADDRESS_ELE_ID_RANGE);
	if (m) {
		[m0, ele, id, from ,to] = m;
	} else {
		m=address.match(ADDRESS_ELE_ID_FROM);
		if (m) {
			[m0, ele, id, from] = m;
		} else {
			m=address.match(ADDRESS_ELE_ID_TO);
			if (m) {
				[m0, ele, id, to] = m;
			} else {
				m=address.match(ADDRESS_ELE_ID);
				if (m) {
					[m0, ele, id] = m;
				}
			}
		}
	}	
	from=Math.abs(parseInt(from)); to=Math.abs(parseInt(to));
	if (m) {
		const idtype=this.defines[ele].validators.id;
		if (idtype.type=='number') id=parseInt(id);
		let at=idtype.values.indexOf(parseInt(id));
		let first=this.defines[ele].linepos[at] ;
		let last=this.defines[ele].linepos[at+1];
		
		let start=first+(from?from:0);
		let end=to?first+to : last;

		if (start>last) start=last;
		if (end>last) end=last;

		const r=[start , end];
		return r;
	}
	else return [0,0];
}