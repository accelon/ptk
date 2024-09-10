import {Inverted,plContain,
    searchSentence,searchSentenceSync,
    getPostings,loadPostingsSync,loadPostings} from '../fts/index.ts';



export function postingLine(posting:number[]){
    return plContain(posting,this.inverted.tokenlinepos)[0];
}

export const enableFTSFeature=(ptk:any)=>{
    const section=ptk.getSection("_tokens");
    if (!ptk.inverted&&section&&section.length) {
        section.shift();
        const postingstart=ptk.sectionRange('_postings')[0];
        ptk.queryCache={};
        ptk.inverted=new Inverted(section,postingstart);
        ptk.loadPostings=loadPostings;
        ptk.loadPostingsSync=loadPostingsSync;
        ptk.getPostings=getPostings;
        ptk.postingline=postingLine;        
        ptk.searchSentenceSync=searchSentenceSync;   
        ptk.searchSentence=searchSentence;
    }
}