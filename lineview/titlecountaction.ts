import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {plTrim, plContain} from '../fts/posting.ts';
import {bsearchNumber} from "../utils/index.ts";
import {fromObj} from '../utils/index.ts';


export class TitleCountAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
	}
	lineOf(idx:number){
		return this.lines[idx];
	}	
	async run(){
		const ptk=usePtk(this.ptkname);
		let {name,tofind}=this.act[0];
		const at=ptk.header.fulltext.indexOf(name.slice(1));
		const caption=ptk.header.fulltextcaption[at];
		const [phrases,postings]=await ptk.parseQuery(tofind);
		const sections=ptk.header.fulltext;
		const [sectionfrom,sectionto]=ptk.sectionRange(sections[at]).map(it=>ptk.inverted.tokenlinepos[it]);
		//no ranking yet
		let chunkcountobj={},hitcount=0;
        const ck=ptk.attributes.chunktag||'ck';
        const chunktag=ptk.defines[ck];

        for (let i=0;i<postings.length;i++) {
			const pl=plTrim(postings[i], sectionfrom,sectionto);
            const [pllines]=plContain(pl,ptk.inverted.tokenlinepos);
            for (let j=0;j<pllines.length;j++) { //count hit in each chunk
                const at=bsearchNumber(chunktag.linepos, pllines[j])-1;
                if (!chunkcountobj[at]) chunkcountobj[at]=0;
                chunkcountobj[at]++;
                hitcount++;
            }
		}
		let till=this.till;
		let from=this.from;
		if (till==-1) till=this.from+ACTIONPAGESIZE;

		let arr=fromObj(chunkcountobj,(a,b)=>[ parseInt(a) , b]).sort((a,b)=>b[1]-a[1]);
		this.first=0;
		this.last=arr.length;
		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);
		const items=arr.map(it=>{
            const count=it[1];
            const id=chunktag.fields.id.values[it[0]];
            const address=ck+id;
            const title=chunktag.innertext.get(it[0]);
            return { id,title, count,address }
        });
        
		this.ownerdraw={painter:'titlecount', data:{ last:this.last, 
			from:this.from, name, hitcount, caption,ptk,tofind , items}} ;
	}	
}
