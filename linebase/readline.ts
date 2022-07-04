import {bsearchNumber} from '../utils/bsearch.ts';
export const pageOfLine=(line,starts)=>{
    if (line>=starts[starts.length-1]) return starts.length-1;
    return bsearchNumber(starts,line,true);
}
export function notloadedPage(from,to){
    if (from<0) return [];
    if (from>to) to+=from;
    const cstart=pageOfLine(from,this.pagestarts);
    const cend=pageOfLine(to,this.pagestarts);    
    const notloaded=[];
    for (let i=cstart;i<cend+1;i++) {
        if (!this._pages[i]) notloaded.push(i);
    }
    return notloaded;
}
export async function loadLines(from,to){
    const that=this;
    await this.isReady();
    let notloaded;
    if (!to) return;
    if (Array.isArray(from)) {
        const notincache={};
        for (let i=0;i<from.length;i++) {
            notincache[pageOfLine(from[i],this.pagestarts)]=true;
        }
        notloaded=Object.keys(notincache).map(it=>parseInt(it));
    } else {
        if (from>to) to+=from;
        if (!to) to=from+1;
        notloaded=notloadedPage.call(this,from,to);    
    }
    const jobs=[];
    // console.log(from,to,'notloaded',notloaded);
    notloaded.forEach(ck=>jobs.push(this._loader(ck+1)));
    if (jobs.length) await Promise.all(jobs);
}