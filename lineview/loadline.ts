import {openPtk,usePtk,parseAddress} from '../basket/index.ts'
import {ILineViewAddress} from './parser.ts'
import {Action} from './action.ts';
export interface ILineViewItem {
	key   : string,
	text  : string,
	depth : number,  //巢深
	edge  : number, //1 上框線, 2 下框線  , 3 單行(上下框線)
}

async function loadLines(lva){
	const out=[];
	const nodes=lva.nodes();
	const pitaka_lines={};

	for (let i=0;i<nodes.length;i++) {
		if(!pitaka_lines[nodes[i].ptkname]) pitaka_lines[nodes[i].ptkname]=[];
		pitaka_lines[nodes[i].ptkname].push(...nodes[i].getLines());
	}
	for (let ptkname in pitaka_lines) {
		const ptk=usePtk(ptkname);
		if (!ptk) continue;
		await ptk.loadLines(pitaka_lines[ptkname]);//loadLines(ranges));
	}

	let errorcount=0 ,seq=0;
	for (let i=0;i<nodes.length;i++) {//將巢狀結構轉為行陣列，標上深度及框線
		let {action,host,depth}=nodes[i];
		const ptk=usePtk(host);
		if (!ptk) continue;
		const [start,end]=nodes[i].getLines()//.rangeOfAddress(lva.stringify(nodes[i]));
		const prevdepth=i?nodes[i-1].depth:0;
		
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
			const firstchild= (i<nodes.length-1 && nodes[i+1].depth == depth+1) ? nodes[i+1]:null;
			segment.push({seq,idx:j==0?i:-1,host,key:host+':'+(j+start), text, depth , edge,
			firstchild  })
			seq++;
		}
		out.push(...segment);				

	}
	return out;
}
export async function load (lva:LVA) { //載入巢狀行
	if (typeof lva=='undefined') lva=this;
	else if (typeof lva=='string') lva=new LVA(lva);
	const nodes=lva.nodes();
	pitakas={};
	//找出 lva 含的ptkname 及區段			
	for (let i=0;i<nodes.length;i++) {
		const ptkname=nodes[i].ptkname;
		if (!pitakas[ptkname]) pitakas[ptkname]=[];
		pitakas[ptkname].push(nodes[i]);
	}
	const jobs=[]; //先打開所有用到的ptk
	for (let ptkname in pitakas) {
		const ptk=await openPtk(ptkname);
		if (!ptk) {
			//提醒用戶安裝其他ptk
			out.push({key:'error'+(errorcount++) , host, text:'cannot load',depth,edge:3})
		}
	}
	await Promise.all(jobs);
	for (let i=0;i<nodes.length;i++) {
		await nodes[i].run();
	}
	const out=await loadLines(lva);
	return out;
}