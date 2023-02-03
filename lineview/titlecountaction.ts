import {Action} from "./baseaction.ts";
import {ACTIONPAGESIZE} from "./interfaces.ts";
import {IAddress,usePtk,makeChunkAddress} from '../basket/index.ts';
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
		const address=name.slice(1);

		const sectionrange=address?ptk.rangeOfAddress(address):[0,ptk.header.eot+1];
		const caption=ptk.innertext(address);
		const [sectionfrom,sectionto]=sectionrange.map(it=>ptk.inverted.tokenlinepos[it]);
		let chunkcountobj={},hitcount=0 , items=[];
        const chunktag=ptk.defines.ck;
		const bktag=ptk.defines.bk;
		if (!tofind) { //list all chunk in this section
			const at1=chunktag?bsearchNumber(chunktag.linepos, sectionrange[0]):0;
			const at2=chunktag?bsearchNumber(chunktag.linepos, sectionrange[1])+1:0;
			let pagesize=this.till-this.from;
			if (pagesize<ACTIONPAGESIZE) pagesize=ACTIONPAGESIZE;
			
			for (let j=at1+this.from;j<at2;j++) {
				const title=chunktag.innertext.get(j);
				const line=chunktag.linepos[j];
				const ck=ptk.nearestChunk(line+1);
				const address=makeChunkAddress(ck);
				const caption=ck.caption;
				if (items.length>=pagesize) break;
				items.push({id:ck.id,bkid:ck.bkid,caption, title, count:-1, address, line });
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
                const at=bsearchNumber(chunktag.linepos, pllines[j]);
                if (!chunkcountobj[at]) chunkcountobj[at]=0;
                chunkcountobj[at]++;
                hitcount++;
            }
		}
		let till=this.till;
		let from=this.from;

		if (till==-1) till=this.from+ACTIONPAGESIZE;

		let arr=fromObj(chunkcountobj,(a,b)=>[ parseInt(a) , b]).sort((a,b)=>b[1]-a[1]);
		this.last=arr.length;
		if (till>=arr.length) till=arr.length;
		arr=arr.slice(from,till);
		items=arr.map(it=>{
            const count=it[1];
			const chunk=it[0];
			const ck=ptk.nearestChunk(chunktag.linepos[chunk]);
            const address=makeChunkAddress(ck);
            return { id:ck.id, count,address ,caption:ck.caption,title:ck.caption}
        })

		this.first=0;
		
		this.ownerdraw={painter:'titlecount', data:{ last:this.last,
			from:this.from, name, hitcount, caption,ptk,tofind , items}} ;
	}	
}
