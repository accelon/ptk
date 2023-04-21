import {IAddress,usePtk} from '../basket/index.ts';
import {Action,COLUMNFIELDSEP} from "./baseaction.ts";

export class QueryAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx){
		if (idx>=this.res.length) return -1;
		return this.res[idx].line;
	}
	searchLexicon(ptk,name,tofind){
		const lexicon=ptk.primarykeys[name];
		let matcher=lexicon.enumMiddle;
		let enummode=1;
		if (tofind[0]=='$') {
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
		const backref=ptk.columns[name]?.attrs?.backref; 
		this.last=1;
		this.till=1;
		const caption=ptk.columns[name]?.caption;
		this.ownerdraw={painter:'queryresult',
			data:{querytype:'BME',name, caption,ptk,tagname,foreign,tofind, items, backref,lexicon}} ;
	}
	async run(){
		const ptk=usePtk(this.ptkname);
		for (let i=0;i<this.act.length;i++) {
			let {name,tofind}=this.act[i];
			if (ptk.primarykeys[name]) return this.searchLexicon(ptk,name,tofind);
			else if (name.indexOf(COLUMNFIELDSEP)) { //column , field
				const [column,field]= name.split(COLUMNFIELDSEP);
				const out=ptk.searchColumnField( column,field, tofind);
				this.last=out.contain.length;
				this.till=this.from+5;
				if (this.till+1>=this.last)  this.till=this.last-1;
				const items=out.contain.slice(this.from,this.till).map(it=>{
					return it;
				})
				const caption=field;
				
				this.ownerdraw={painter:'queryresult', data:{ptk,caption,column,field,tofind,items,from:this.from,last:this.last}};
			}
		}
	}
}