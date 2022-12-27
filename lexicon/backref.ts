/*
    lookup column[name] with key, if keycolname is supplied, convert to norm key
*/
import {fromObj} from '../utils/sortedarray.ts'
import {similaritySet} from '../utils/array.ts'


export const lookupKeyColumn=(ptk,name, key, keycolname)=>{
    const column = ptk.columns[name];
    let at=column.findKey(key);

    if (keycolname) { //normalize the key
        const keycolumn=ptk.columns[keycolname];
        const norm_at=keycolumn.fieldnames.indexOf('norm');
        const at2=keycolumn.findKey(key);
        if (~norm_at) { // use the norm form
            const norm=keycolumn.fieldvalues[norm_at][at2];
            if (norm) {
                key=norm;
                at=column.findKey(key);
            }
        }   
    }
    
    if (!~at) return [];
    const out=column.fieldvalues[1][at];
    return out;
}

export const countMembers=(items,foreigncol,tofind,col)=>{
    const members={}
    const tofinds=tofind.split(',');
    for (let i=0;i<items.length;i++) {
        const at=foreigncol.findKey(items[i]);
        const list=foreigncol.fieldvalues[0][at];
        for (let i=0;i<list?.length;i++) {
            if (!members[list[i]]) members[list[i]]=0;
            members[list[i]]++;
        }
    }
    let arr=fromObj(members,true);

    if (tofind && arr.length) {  // caller supply tofind, trim redundant items
        if (col.findKey(tofinds[0])==arr[0][0]) {
            arr.shift(); //drop dup the key
        }

        const avg=arr.reduce((acc , it)=>it[1]+acc , 0) / arr.length; 
        arr=arr.filter(it=>it[1]>=avg/2);
        
        let drop=tofinds.length-1;
        while (drop) {arr.shift();drop--}
    }
    return arr;
}
const threshold=0.75;
export const calApprox=( col,members)=>{
    let idx=0;
    if (col.attrs.keytype!=='serial') idx++;
    const out=[];
    const values=col.fieldvalues[idx];
    for (let i=0;i<values.length;i++) {
        const v=values[i];
        const similarity=similaritySet(v, members); 
        if (similarity>threshold) {

            out.push([i, similarity]);
        }
    }
    return out;
}