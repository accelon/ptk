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
		const [choices,groupby,groupfilter]=ptk.template.parseChoice(action);

		const col=ptk.columns[ptk.template.filterColumn];
		const master=ptk.defines[col.attrs.master];
		
		let {items,groups}=ptk.template.runFilter(ptk,col,{choices,groupby,groupfilter});

		items=items.map( idx =>{
			const line=master.linepos[idx];
			const ck=ptk.getNearestChunk(line); 
			const size=master.linepos[line+1]?master.linepos[line+1]:ptk.header.eot;
			const lineoff=line-ck.line;
			const record=[];
			const recordend= master.linepos[idx+1];

			for (let i=0;i<col.fieldnames.length;i++) {
				const def=ptk.defines[col.fieldnames[i]];
				if (!def) continue;
				const at=bsearchNumber(def.linepos,line); //nearest record-field
				if ( def.linepos[at]<recordend) {
					record.push(  def.linepos[at] );
				}
			}
			if (!ck) return null;

			return {chunkname:ck.name,line,size,ck,lineoff, record}
		}).filter(it=>!!it);
		
		this.ownerdraw={painter:'guide', data:{from:this.from, actionprefix,idx,
			items, name, action,caption,ptk}} ;
    }
}