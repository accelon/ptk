import {openPtk,usePtk,parseAddress} from '../basket/index.ts'
import {ILineViewAddress,parseLVA,stringifyLVA} from './parser.ts'
export interface ILineViewItem {
	key   : string,
	text  : string,
	depth : number,  //巢深
	edge  : number, //1 上框線, 2 下框線  , 3 單行(上下框線)
}

export const loadLVA = async (address:string) =>{ //載入巢狀行
	const items=parseLVA(address);
	console.log(items)
	let scope_pitaka=[],  //每層指定的ptkname ，若本層沒指定，就往上層找
	out=[] , pitaka_ranges={};
	//找出 lva 含的ptkname 及區段
				
	for (let i=0;i<items.length;i++) {
		const {depth} = items[i];
		let  ptkname=items[i].host || scope_pitaka[depth], d=depth;
		if (!pitaka_ranges[ptkname]) pitaka_ranges[ptkname]=[];
		pitaka_ranges[ptkname].push(items[i]);
	}

	const jobs=[]; //先打開所有用到的ptk
	for (let ptkname in pitaka_ranges) {
		const ptk=await openPtk(ptkname);
		if (!ptk) continue;
	}

	await Promise.all(jobs);
	for (let ptkname in pitaka_ranges) {
		const ptk=usePtk(ptkname);
		if (!ptk) continue;
		const ranges=pitaka_ranges[ptkname].map(lva=>ptk.rangeOfAddress(stringifyLVA(lva)));
		await ptk.loadLines(ranges);//loadLines(ranges));
	}

	let errorcount=0 ,seq=0;

	for (let i=0;i<items.length;i++) {//將巢狀結構轉為行陣列，標上深度及框線
		let {left,right,host,depth}=items[i];
		const ptk=usePtk(host);
		const [start,end]=ptk.rangeOfAddress(stringifyLVA(items[i]));
		const prevdepth=i?items[i-1].depth:0;
		
		if (ptk) {
			const lines=ptk.slice(start,end);
			const segment=[];
			for (let j=0;j<lines.length;j++) { //優先顯示更深的層級框線
				const text=lines[j];
				let edge=0;
				if (j===0) edge|=1; //上框線
				if (j===lines.length-1) edge|=2; //下框線  edge==3 只有一行的顯示上下框
				//本行的層級更深，除去上行的下框線
				// if (!prevdepth && i && out.length && out[out.length-]
				if(depth>prevdepth && (edge&2===2) && out.length) out[out.length-1].edge^=2;
				//上行的層級更深，除去本行的上框線不顯示
				if(prevdepth>depth && (edge&1===1)) edge^=1;
				segment.push({seq,lva:j==0?stringifyLVA(items[i]):null,host,key:host+':'+(j+start), text, depth , edge })
				seq++;
			}
			out.push(...segment);				
		} else {
			//提醒用戶安裝其他ptk
			out.push({key:'error'+(errorcount++) , host, text:'cannot load',depth,edge:3})
		}
	}
	return out;
}