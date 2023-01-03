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
		const selected=action.split(',').filter(it=>!!it);

		const pickercolname=ptk.attributes.picker; //symtom
		const guidetag=ptk.attributes.picker+'s'; //^symtoms in text

		//在這些行中找 selected 
		const linepos=ptk.defines[guidetag].linepos;//should be found in this linepos
		const pickercol=ptk.columns[pickercolname];

		const tofinds=[];
		for (let i=0;i<selected.length;i++) {
			const at=pickercol.keys.find(selected[i]);
			const expanded=pickercol.fieldvalues[3][at];
			if (expanded) {
				tofinds.push(...expanded.split(','));
			} else {
				tofinds.push(pickercol.fieldvalues[2][at]);
			}
		}
		
		const q=await ptk.parseQuery(tofinds.join(' '));

		//join all q
		let postings=q[1];
		
		const score=ptk.scoreLine(postings);
		const guideline=[];
		for (let i=0;i<score.length;i++) {
			const pos=score[i][0];
			const at=bsearchNumber( linepos, pos);
			if (linepos[at] ==pos) {
				guideline.push([pos, score[i][2]]);
				if (guideline.length>=100) break;
			}
		}

		await ptk.loadLines(guideline.map(item=>item[0]));

		const items=guideline.map( ([line,chunk])=>{
			const chunkname=ptk.defines.ck.innertext.get(chunk);
			const text=ptk.getLine(line);
			return {chunkname,text,line,chunk}
		})
		
		this.ownerdraw={painter:'guide', data:{from:this.from, actionprefix,idx,
			items, name, action,caption,ptk}} ;
    }
}