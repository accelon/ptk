/* excerpt line created by boolean match of backref*/
import {Action} from "./baseaction.ts";
import {intersects} from '../utils/array.ts'
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {lookupKeyColumn} from '../lexicon/backref.ts'

export class BooleanExcerptAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
    async run(){
        let hitcount=0,caption,lines=[],hits=[],phraselength=[],samechunkline;
        const ptk=usePtk(this.ptkname);
		let {name,tofind}=this.act[0];
        const [colname , members ]=name.slice(1).split('@'); 
        
        const tofinds=tofind.split(',');
        const refcolname=members+'2'+colname;
        const items=intersects(tofinds.map(it=>lookupKeyColumn(ptk,refcolname,it,members)));
        
        const linepos=ptk.defines[colname].linepos;
        lines=items.map(it=> linepos[it]);

        let till=this.till;
		let from=this.from;
		if (till==-1) till=this.from+ACTIONPAGESIZE;
        this.first=0;
		this.last=lines.length;
		if (till>=lines.length) till=lines.length;
		lines=lines.slice(from,till);


        // console.log(this.from,this.last)
        this.ownerdraw={painter:'excerpt', data:{ last:this.last, samechunkline ,
            from:this.from, name, hitcount, caption,ptk,tofind , lines,hits,phraselength}} ;
   
    }
}
