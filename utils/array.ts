import {bsearchNumber} from "./bsearch.ts";
import {unique} from './sortedarray.ts';
type NumberArray = number [];
//arr need to be sorted but allow duplicate items
export const union=(arr1:NumberArray,arr2:NumberArray,hasdup=false):NumberArray=>{
    if (!arr2||!arr1) return arr1||arr2;
    let out:NumberArray=[];
    const extra:NumberArray=[];
    let a1=hasdup?unique(arr1):arr1;
    let a2=hasdup?unique(arr2):arr2;
    if (a1.length>a2.length) {
        const a=a2;
        a2=a1;
        a1=a;
    }
    for (let i=0;i<a1.length;i++) {
        const at1=bsearchNumber(a2,a1[i]);
        if (at1==-1) extra.push(a1[i]);
    }
    return a2.concat(extra).sort();
}
export const intersect=(arr1:NumberArray,arr2:NumberArray):NumberArray=>{
    const out:NumberArray=[];
    let j=0;
    for (let i=0;i<arr1.length;i++) {
        let v=arr1[i];
        while (j<arr2.length) {
            if (arr2[j]>=v) break;
            j++;
        }
        if (v==arr2[j] && out[out.length-1]!==v) out.push(v);
        if (j==arr2.length) break;
    }
    return out;
}

export const removeSubstring=(arr:NumberArray):NumberArray=>{
    const markdelete:NumberArray=[];
    for (let i=0;i<arr.length;i++) {
        for (let j=0;j<arr.length;j++) {
            if (i==j) continue;
            if (arr[i].indexOf(arr[j])>-1 && arr[j].length<arr[i].length) {
                if (markdelete.indexOf(j)==-1) markdelete.push(j);
            }
        }
    }
    return arr.filter( (it,idx)=> markdelete.indexOf(idx)==-1 );
}