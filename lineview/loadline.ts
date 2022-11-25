import {openPtk,usePtk} from '../basket/index.ts'
import {ILineViewAddress} from './interfaces.ts'
export interface ILineViewItem {
	key   : string,
	text  : string,
	depth : number,  //巢深
	edge  : number, //1 上框線, 2 下框線  , 3 單行(上下框線)
}

async function loadLines(lva, noparallel=false){
	const jobs=[], out=[];
	const divisions=lva.divisions();
	const pitaka_lines={};
	for (let i=0;i<divisions.length;i++) {
		if(!pitaka_lines[divisions[i].ptkname]) pitaka_lines[divisions[i].ptkname]=[];
		pitaka_lines[divisions[i].ptkname].push(...divisions[i].getLines());
		//load all parallel
		const parallels=divisions[i].getParallelWithDiff();
		const ptk=usePtk(divisions[i].ptkname);
	
		if (!noparallel) {
			for ( let j=0;j< parallels.length;j++) {
				const [pptk,linediff]=parallels[j];
				if (!ptk.parallels[pptk.name]) continue;
	
				let lines=divisions[i].getLines();
				if (linediff!==0) lines=lines.map(i=>i+linediff);
				if(!pitaka_lines[pptk.name]) pitaka_lines[pptk.name]=[];
				pitaka_lines[pptk.name].push( ...lines );
			}	
		}
	}
	for (const ptkname in pitaka_lines) {
		const ptk=usePtk(ptkname);
		if (!ptk) continue;
		jobs.push(ptk.loadLines(pitaka_lines[ptkname]));
	}

	await Promise.all(jobs);
	let seq=0;
	for (let i=0;i<divisions.length;i++) {//將巢狀結構轉為行陣列，標上深度及框線
		const {action,ptkname,depth,ownerdraw,highlightline,first,from}=divisions[i];
		const ptk=usePtk(ptkname);
		if (ownerdraw) {
			out.push({seq,idx:i,ownerdraw,depth,ptkname,key: ptkname+':'+action,closable:true })
			seq++;
			continue;
		}

		if (!ptk) continue;

		const segment=[];
		const lines=divisions[i].getLines();
		const linetexts=ptk.getLines(lines);

		const prevdepth=i?divisions[i-1].depth:0;

		for (let j=0;j<linetexts.length;j++) { //優先顯示更深的層級框線
			const text=linetexts[j];
			let edge=0;
			if (j===0) edge|=1; //上框線
			if (j===linetexts.length-1) edge|=2; //下框線  edge==3 只有一行的顯示上下框
			//本行的層級更深，除去上行的下框線
			// if (!prevdepth && i && out.length && out[out.length-]
			if(depth>prevdepth && (edge&2===2) && out.length) out[out.length-1].edge^=2;
			//上行的層級更深，除去本行的上框線不顯示
			if(prevdepth>depth && (edge&1===1)) edge^=1;
			const closable=((edge==1||edge==3) ) || !divisions[i].diggable;
			
			const sponser=closable&&from==0?'某三寶弟子':''
			//show remain button on last line
			//todo , do not show on left part of splited division
			const highlight= highlightline-divisions[i].from == j   ; //relative to begining of chunk

			segment.push({seq,idx:j==0?i:-1,ptkname, key:ptkname+':'+(lines[j]), 
				line:lines[j],highlight,text, depth, edge,closable,sponser});
			seq++;
		}
		out.push(...segment);
	}
	lva.loadedItems=out;
	return out;
}
export async function load (lva:ILineViewAddress) { //載入巢狀行
	if (typeof lva=='undefined') lva=this;
	else if (typeof lva=='string') lva=new LVA(lva);
	const divisions=lva.divisions();
	let pitakas={};
	//找出 lva 含的ptkname 及區段			
	for (let i=0;i<divisions.length;i++) {
		const ptkname=divisions[i].ptkname;
		if (!pitakas[ptkname]) pitakas[ptkname]=[];
		pitakas[ptkname].push(divisions[i]);
	}
	const jobs=[]; //先打開所有用到的ptk
	for (let ptkname in pitakas) {
		const ptk=await openPtk(ptkname);
		if (!ptk) {
			//提醒用戶安裝其他ptk
			// errors.push({key:'error'+(errorcount++) , host, text:'cannot load',depth,edge:3});
		}
	}
	await Promise.all(jobs);
	for (let i=0;i<divisions.length;i++) {
		await divisions[i].run();
	}
	const out=await loadLines(lva);

	return out;
}