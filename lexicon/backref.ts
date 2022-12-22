/*
    lookup column[name] with key, if keycolname is supplied, convert to norm key
*/
import {fromObj} from '../utils/sortedarray.ts'

export const lookupKeyColumn=(ptk,name, key, keycolname)=>{
    const column = ptk.columns[name];
    let at=column.keys.find(key);

    if (keycolname) { //normalize the key
        const keycolumn=ptk.columns[keycolname];
        const norm_at=keycolumn.fieldnames.indexOf('norm');
        if (~norm_at) { // use the norm form
            const norm=keycolumn.fieldvalues[norm_at][at];
            if (norm) {
                key=norm;
                at=keycolumn.keys.find(key);
            }
        }   
    }
    
    if (!~at) return [];
    const at2=column.keys.find(key);
    const out=column.fieldvalues[0][at2];
    return out;
}

export const countMembers=(items,foreigncol,tofind)=>{
    const members={}
    for (let i=0;i<items.length;i++) {
        const key=items[i];
        const list=foreigncol.fieldvalues[0][key];
        for (let i=0;i<list.length;i++) {
            if (!members[list[i]]) members[list[i]]=0;
            members[list[i]]++;
        }
    }
    let arr=fromObj(members,true);
    arr.shift();//drop the key

    if (tofind) {  // caller supply tofind, trim redundant items
        const avg=arr.reduce((acc , it)=>it[1]+acc , 0) / arr.length; 
        arr=arr.filter(it=>it[1]>avg);
        const tofinds=tofind.split(',');
        let drop=tofinds.length-1;
        while (drop) {arr.shift();drop--}
    }
    return arr;
}
