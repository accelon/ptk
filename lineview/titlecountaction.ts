import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk} from '../basket/index.ts';
import {plTrim, plContain} from '../fts/posting.ts';
import {bsearchNumber} from "../utils/index.ts";
import {fromObj} from '../utils/index.ts';

const listChunk=(from:number,to:number)=>{

}
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
		const address=name.slice(1)
		const sectionrange=address?ptk.rangeOfAddress(address):[0,ptk.header.eot];

		const caption=ptk.captionOfAddress(address);
		const [sectionfrom,sectionto]=sectionrange.map(it=>ptk.inverted.tokenlinepos[it]);
		let chunkcountobj={},hitcount=0 , items=[];
        const chunktag=ptk.defines.ck;

		if (!tofind) { //list all chunk in this section
			const at1=bsearchNumber(chunktag.linepos, sectionrange[0]);
			const at2=bsearchNumber(chunktag.linepos, sectionrange[1]);
			let pagesize=this.till-this.from;
			if (pagesize<ACTIONPAGESIZE) pagesize=ACTIONPAGESIZE;
			for (let j=at1+this.from;j<at2;j++) {
				const id=chunktag.fields.id.values[j];
				const title=chunktag.innertext.get(j);
				const address='ck'+(parseInt(id)?id:'#'+id);
				if (items.length>=pagesize) break;
				items.push({id, title, count:-1, address, line: chunktag.linepos[j] });
			}
	
			this.ownerdraw={painter:'titlecount', data:{ last:at2-at1,
				from:this.from, name, hitcount, caption,ptk,tofind , items}} ;

			return;
		}

		const [phrases,postings]=await ptk.parseQuery(tofind);

		//no ranking yet

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

		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);
		items=arr.map(it=>{
            const count=it[1];
            const id=chunktag.fields.id.values[it[0]];
            const address='ck'+(parseInt(id)?id:'#'+id);
            const title=chunktag.innertext.get(it[0]);
            return { id,title, count,address }
        })
		
		this.first=0;
		this.last=arr.length;
		this.ownerdraw={painter:'titlecount', data:{ last:this.last,
			from:this.from, name, hitcount, caption,ptk,tofind , items}} ;
	}	
}
