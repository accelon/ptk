import {parseLisp,LispToken} from './lisp.ts';
import {openPtk,usePtk} from '../basket/index.ts'
export interface ILineViewItem {
	key   : string,
	text  : string,
	depth : number,  //巢深
	edge  : number, //1 上框線, 2 下框線  , 3 單行(上下框線)
}
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
export const loadLVA = async (address:string) =>{ //載入巢狀行
	const lisp=parseLVA(address);
	let scope_pitaka=[],  //每層指定的ptkname ，若本層沒指定，就往上層找
	out=[] , pitaka_ranges={};
	//找出 lva 含的ptkname 及區段
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
	const jobs=[]; //先打開所有用到的ptk
	for (let ptkname in pitaka_ranges) {
		const ptk=await openPtk(ptkname);
		if (!ptk) continue;
	}
	await Promise.all(jobs);
	jobs.length=0; //載入所有的區段
	for (let ptkname in pitaka_ranges) {
		const ptk=usePtk(ptkname);
		if (!ptk) continue;
		jobs.push(ptk.loadLines(pitaka_ranges[ptkname]));
	}
	await Promise.all(jobs);
	let prevdepth=0, errorcount=0;
	eachLVA( lisp, 0 , (item,idx,depth)=>{  //將巢狀結構轉為行陣列，標上深度及框線
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
				const segment=[];
				for (let i=0;i<lines.length;i++) { //優先顯示更深的層級框線
					const text=lines[i];
					let edge=0;
					if (i===0) edge+=1; //上框線
					if (i===lines.length-1) edge+=2; //下框線  edge==3 只有一行的顯示上下框
					//本行的層級更深，除去上行的下框線
					if(depth>prevdepth && (edge&2===2) && out.length) out[out.length-1].edge=0;
					//上行的層級更深，除去本行的上框線不顯示
					if(prevdepth>depth && (edge&1===1)) edge=0;
					segment.push({key:ptkname+':'+(i+from), text, depth , edge})
				}
				out.push(...segment);				
			} else {
				//提醒用戶安裝其他ptk
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