import {parseLisp,LispToken} from './lisp.ts';
import {openPtk,usePtk} from '../basket/index.ts'

export const parseLVA = (address:string)=>{
	if (address[0]!=='(') address='('+address+')';
	const expr=parseLisp(address);
	return expr;
}
const parseRange=(item)=>{
	let from,to;
	if (item.type==LispToken.Integer) {
		from=item.value; to=from+1;
	} else {
		const [from1,to1]=item.value.split('~');
		from=parseInt(from1);to=parseInt(to1);
	}
	if (!to) to=from+1;
	return [from,to];
}
export const loadLVA = async (address:string) =>{
	const lisp=parseLVA(address);
	let scope_pitaka=[], out=[] , pitaka_ranges={};
	eachLVA( lisp, 0 , (item,idx,depth)=>{
		if (item.type==LispToken.Symbol) {
			scope_pitaka[depth]=item.value;
		} else if (item.type==LispToken.Range || item.type==LispToken.Integer) {
			let  ptkname=scope_pitaka[depth], d=depth;
			while (d&&!ptkname) ptkname=scope_pitaka[--d];
			if (!pitaka_ranges[ptkname])pitaka_ranges[ptkname]=[];
			pitaka_ranges[ptkname].push( parseRange(item));
		}
	})
	for (let ptkname in pitaka_ranges) {
		const ptk=await openPtk(ptkname);
		if (!ptk) continue;
		await ptk.loadLines(pitaka_ranges[ptkname]);
	}
	let prevdepth=0, errorcount=0;
	//fill up lineview array
	eachLVA( lisp, 0 , (item,idx,depth)=>{
		if (item.type==LispToken.Symbol) {
			scope_pitaka[depth]=item.value;
		} else if (item.type==LispToken.Range || item.type==LispToken.Integer) {
			const [from,to]=parseRange(item);
			let ptkname=scope_pitaka[depth];
			let d=depth;
			while (d&&!ptkname) ptkname=scope_pitaka[--d];
			const ptk=usePtk(ptkname);
			if (ptk) {
				const lines=ptk.slice(from,to);
				const segment=(lines.map((text,idx)=>{
					let edge=0;
					if (idx==0) edge+=1; //上邊界
					if (idx==lines.length-1) edge+=2; //下邊界  edge==3 只有一行的 區段

					if (prevdepth>depth && edge==1) edge=0;
					else if (prevdepth<depth && edge==2) edge=0;

					return {key:ptkname+':'+(idx+from), text, depth , edge};
				}));
				out.push(...segment);				
			} else {
				//提醒用戶安裝ptk
				out.push({key:'error'+(errorcount++) , text:'!!'+ptkname, depth,edge:3})
			}
		}
		prevdepth=depth;
	});
	return out;
}
export const eachLVA=(lva:[],depth=0,cb)=>{
	lva.forEach((item,idx)=>Array.isArray(item)?eachLVA( item,depth+1,cb ) :cb(item,idx,depth));
}

export const stringifyLVA= (lva:[], url=false)=>{
	let out=[], prev=false;

	lva.forEach((item,idx)=>{
		if (Array.isArray(item)) {
			out.push('('+stringifyLVA(item,url)+')');
			prev=true;
		} else {
			const v= (idx && !prev?(url?'+':' '):'')+item.value;
			out.push(v);
			prev=false;
		}
	});
	return out.join('');
}