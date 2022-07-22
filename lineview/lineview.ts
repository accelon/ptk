import {parseLisp,LispToken} from './lisp.ts';
import {openPtk,usePtk,parseAddress} from '../basket/index.ts'
import {ILineRange} from '../linebase/index.ts'
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
const parseRange=(token:[LispToken,string],ptk):ILineRange=>{
	let from,to;
	if (token.type===LispToken.Integer) {
		from=token.value; to=from+1;
	} else if (token.type===LispToken.Address) {
		[from,to]=ptk.rangeOfAddress(token.value);	
	} else {
		let [from1,to1]=token.value.split('~');
		if (!to1) to1=from+1;
		from=parseInt(from1)+ptk.textStart;to=parseInt(to1)+ptk.textStart;
	}

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
		} else {
			let  ptkname=scope_pitaka[depth], d=depth;
			while (d&&!ptkname) ptkname=scope_pitaka[--d];
			if (!pitaka_ranges[ptkname])pitaka_ranges[ptkname]=[];
			pitaka_ranges[ptkname].push( item);
		}
	})
	const jobs=[]; //先打開所有用到的ptk
	for (let ptkname in pitaka_ranges) {
		const ptk=await openPtk(ptkname);
		if (!ptk) continue;
	}

	await Promise.all(jobs);
	for (let ptkname in pitaka_ranges) {
		const ptk=usePtk(ptkname);
		if (!ptk) continue;
		const ranges=pitaka_ranges[ptkname].map(item=>parseRange(item,ptk));
		await ptk.loadLines(ranges);//loadLines(ranges));
	}
			
	let prevdepth=0, errorcount=0 ,seq=0;
	let prevlva=-1;//use to link to firstChild, for ToggleLink
	eachLVA( lisp, 0 , (item,idx,depth)=>{  //將巢狀結構轉為行陣列，標上深度及框線
		if (item.type==LispToken.Symbol) {
			scope_pitaka[depth]=item.value;
		} else if (item.type==LispToken.Range || item.type==LispToken.Integer || item.type==LispToken.Address) {
			let from,to;
			let d=depth;
			let ptkname=scope_pitaka[depth];
			while (d&&!ptkname) ptkname=scope_pitaka[--d];
			const ptk=usePtk(ptkname);
			if (ptk) {
				[from,to]=parseRange(item,ptk);
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
					const lva=(i==0)?item:null;
					segment.push({seq,lva,next:-1,ptkname,key:ptkname+':'+(i+from), text, depth , edge })
					seq++;
				}
				if (prevlva>-1) {
					out[prevlva].next = out.length;
				}
				prevlva=out.length;
				out.push(...segment);				
			} else {
				//提醒用戶安裝其他ptk
				out.push({key:'error'+(errorcount++) , ptkname, text:'cannot load',depth,edge:3})
			}
		}
		prevdepth=depth;
	});
	return [out,lisp ,scope_pitaka.length&&scope_pitaka[0]];
}
export const eachLVA=(lva:[],depth=0,cb)=>{
	lva.forEach((item,idx)=>Array.isArray(item)?eachLVA( item,depth+1,cb ) :cb(item,idx,depth));
}
export const breakLVA=(token, breakat , newaddress) =>{
	const out=[];
	if (token.type==LispToken.Address) {
		const [left,right,eleid]=parseAddress(token.value);
		out.push('@'+eleid+ (left?'<'+left:'') + '>'+(breakat+1));
		out.push('('+newaddress+')');
		out.push('@'+eleid+'<'+(breakat+1)+ (right?'>'+right:'')) ;
	} else { //numeric range
		let [from1,to1]=token.value.split('~');
		if (!to1) to1=from+1;
		const from=parseInt(from1)+ptk.textStart, to=parseInt(to1)+ptk.textStart;
		out.push(from+'~'+breakat);
		out.push(newaddress);
		out.push(breakat+'~'+to);
	}
	return parseLVA(out.join(' '));
}
export const combineLVA=(tk1,tk2)=>{
	if (tk1.type==LispToken.Address && tk2.type==LispToken.Address) {
		const [left1,right1,eleid1]=parseAddress(tk1.value);
		const [left2,right2,eleid2]=parseAddress(tk2.value);
		if (eleid1==eleid2 && right1==left2) {
			return parseLVA('@'+eleid1+ (left1?'<'+left1:'')+(right2?'>'+right2:''));
		}
	} else  {
		let [from1,to1]=tk1.value.split('~');
		let [from2,to2]=tk2.value.split('~');
		if (to1==from2) {
			return parseLVA(from1+'~'+to2);
		}
	}
}

export const stringifyLVA= (lva:[], ptkname='')=>{
	let out=[];
	lva.forEach((item,idx)=>{
		if (Array.isArray(item)) {
			out.push('('+stringifyLVA(item,ptkname)+')');
		} else {
			if (item.type==LispToken.Symbol) {
				if (item.value!==ptkname) out.push(item.value);
			} else {
				out.push(item.value);
			}
		}
	});
	return out.join('+').replace(/\+?([\)\(])\+?/g,'$1');
}