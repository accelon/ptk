import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {plTrim,plContain} from '../fts/posting.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {fromObj,bsearchNumber} from '../utils/index.ts';
import { calApprox} from '../lexicon/backref.ts';
export class ApproxAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx:number){
		return this.lines[idx];
	}
	getApprox(ptk,tagname,id) {
		const col=ptk.columns[tagname];
		const at=col.findKey(id);
		const members=col.fieldvalues[0][at];
			// const foreigncol=ptk.columns[foreign];
		// console.log(    out.map(it=>  foreigncol.keys.get(it)));
		const approx=calApprox(col, members );
		const out=approx.map( ([at,similarity])=>{
			const _id = col.keys?col.keys.get(at):at+1;
			const linepos = ptk.defines[tagname].linepos;
			return (id==_id) ? null: {  id:_id,similarity,line: linepos[at] };
		}).filter(it=>!!it).sort((a,b)=>b.similarity- a.similarity);
		return out;
	}
	async run(){
        let hitcount=0,caption,samechunkline;
        const ptk=usePtk(this.ptkname);
		let {name,tofind}=this.act[0];
        const tagname=name.slice(1);
		const id=tofind.slice(tofind.indexOf('~')+1);
        const items=this.getApprox(ptk,tagname,id)
		const similarity=items.map(it=> it.similarity);
        let lines=items.map(it=> it.line);

        let till=this.till;
		let from=this.from;
		if (till==-1) till=this.from+ACTIONPAGESIZE;
        this.first=0;
		this.last=lines.length;
		if (till>=lines.length) till=lines.length;
		lines=lines.slice(from,till);

        // console.log(this.from,this.last)
        this.ownerdraw={painter:'approx', data:{ last:this.last, samechunkline ,
            from:this.from, name, hitcount, caption,ptk,tofind , lines,similarity}} ;
   
	}	
}
