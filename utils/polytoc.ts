import {fromBase26} from './base26.ts';
export const parsePolyToc=(str:string)=>{
    const items=str.split(/(\d+)/).filter((it:string)=>!!it);
    const out=[];
    for (let i=0;i<items.length;i++) {
        const it=items[i];
        if (parseInt(it).toString()==it) {
            out.push(parseInt(it));
        } else {
            out.push(fromBase26(it));
        }
    }
    return out;
}