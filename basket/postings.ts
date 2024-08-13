import {unpackIntDelta,bsearchNumber} from '../utils/index.ts';
import {Inverted,plContain} from '../fts/index.ts';

export async function loadPostings(s:string){
    if (!this.inverted) return;
    const nPostings=this.inverted.nPostingOf(s);
    const postinglines=[];
    const that=this;
    for (let i=0;i<nPostings.length;i++) {
        if (nPostings[i]<0) continue;
        const line=this.inverted.postingStart+nPostings[i];
        postinglines.push([line,line+1]);
    }
    //must sort for combineRange
    postinglines.sort((a,b)=>a[0]-b[0])
    await that.loadLines(postinglines);
    
    for (let i=0;i<nPostings.length;i++) {
        const at=nPostings[i];
        if (at==-1) continue;
        const line=this.inverted.postingStart+nPostings[i];
        if (!this.inverted.postings[at]) {
            const packedline=that.getLine(line);
            this.inverted.postings[at]=unpackIntDelta(packedline);
        }
    }
    return this.getPostings(s);
}

export function getPostings(s:string){
    const nPostings=this.inverted.nPostingOf(s);
    const postings=this.inverted.postings;
    return nPostings.map( np=> postings[np] );
}

export function postingLine(posting:number[]){
    return plContain(posting,this.inverted.tokenlinepos)[0];
}

export const enableFeatureFTS=(ptk:any)=>{
    const section=ptk.getSection("tokens");
    if (!ptk.inverted&&section&&section.length) {
        section.shift();
        const postingstart=ptk.sectionRange('_postings')[0];
        ptk.inverted=new Inverted(section,postingstart);
        ptk.loadPostings=loadPostings;
        ptk.getPostings=getPostings;
        ptk.postingline=postingLine;        
    }
}