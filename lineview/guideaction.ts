import {Action,GUIDEACTIONPREFIX} from "./baseaction.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {bsearchNumber} from '../utils/bsearch';
export class GuideAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.address =addr;
	}
	async run(){
        const ptk=usePtk(this.ptkname);
        const caption=ptk.captionOfAddress(this.address);
        let {name}=this.act[0];
		const action=this.address.action.slice(1);
		const idx=this.dividx;
		const actionprefix=GUIDEACTIONPREFIX;
		const choices=ptk.template.parseChoice( action);

		const col=ptk.columns[ptk.template.filterColumn];
		const textstart=ptk.getSectionStart(col.attrs.textstart)||0;
		const matchline=ptk.template.runFilter(col,choices,textstart);

		await ptk.loadLines(matchline);

		const items=matchline.map( line =>{
			const ck=ptk.getNearestChunk(line);
			const text=ptk.getLine(line);
			const lineoff=line-ck.line;
			if (!ck) return null;
			return {chunkname:ck.name,text,line,ck,lineoff}
		}).filter(it=>!!it);
		
		this.ownerdraw={painter:'guide', data:{from:this.from, actionprefix,idx,
			items, name, action,caption,ptk}} ;
    }
}