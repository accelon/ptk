import {IAddress,usePtk} from '../basket/index.ts';
import {Action} from "./baseaction.ts";
export class QueryAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx){
		if (idx>=this.res.length) return -1;
		return this.res[idx].line;
	}
	async run(){
		const ptk=usePtk(this.ptkname);
		for (let i=0;i<this.act.length;i++) {
			let {name,tofind}=this.act[i];
			const lexicon=ptk.primarykeys[name];
			if (!lexicon) continue;
			let matcher=lexicon.enumMiddle;
			let enummode=1;
			if (tofind[0]=='^') {
				enummode=0;
				matcher=lexicon.enumStart;
				tofind=tofind.slice(1);
			} else if (tofind[tofind.length-1]=='$') { //regular expression style
				enummode=2;
				matcher=lexicon.enumEnd;
				tofind=tofind.slice(0,tofind.length-1);
			}
			const items=matcher.call(lexicon,tofind);
			const tagname=ptk.columns[name]?.attrs?.tagname;
			const foreign=ptk.columns[name]?.attrs?.foreign || ptk.columns[name]?.fieldnames[0];
			this.last=1;
			this.till=1;
			const caption=ptk.columns[name]?.caption;
			this.ownerdraw={painter:'queryresult',
			 data:{name, caption,ptk,tagname,foreign,tofind, items, lexicon}} ;
		}
	}
}