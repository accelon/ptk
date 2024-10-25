import {unpackIntDelta,bsearchNumber} from '../utils/index.ts';

export function loadPostingsSync(s:string){
    const ptk=this;
    const nPostings=ptk.inverted.nPostingOf(s);
    for (let i=0;i<nPostings.length;i++) {
        const at=nPostings[i];
        if (at==-1) continue;
        const line=ptk.inverted.postingStart+nPostings[i];
        if (!ptk.inverted.postings[at]) {
            const packedline=ptk.getLine(line);
            ptk.inverted.postings[at]=unpackIntDelta(packedline);
        }
    }
    return this.getPostings(s);
}
export function getPostings(s:string){
    const nPostings=this.inverted.nPostingOf(s);
    const postings=this.inverted.postings;
    return nPostings.map( np=> postings[np] );
}
const loadPostinglines=async (ptk,s:string)=>{
    if (!ptk.inverted) return;
    const nPostings=ptk.inverted.nPostingOf(s);
    const postinglines=[];
    for (let i=0;i<nPostings.length;i++) {
        if (nPostings[i]<0) continue;
        const line=ptk.inverted.postingStart+nPostings[i];
        postinglines.push([line,line+1]);
    }
    //must sort for combineRange
    postinglines.sort((a,b)=>a[0]-b[0])
    await ptk.loadLines(postinglines);
    return postinglines;
}

export async function loadPostings(s:string){
    const ptk=this;
    await loadPostinglines(ptk,s);
    return ptk.loadPostingsSync.call(ptk,s);
}	