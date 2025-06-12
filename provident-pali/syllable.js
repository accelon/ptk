export const syllablify=w=>{
    const syl=w.split(/([kKgGbcCjJBpPtTdDFQWXhHlLmnsSvNyrY][EIOUA]{0,2}M?)/).filter(it=>!!it);
    const out=[];
    let i=0, isV=false;
    while (i<syl.length) {
        if (syl[i]==='V') {
            out[out.length-1]+=syl[i]+syl[i+1];
            i++;
        } else {
            out.push(syl[i])
        }
        i++;
    }
    return out;
}
