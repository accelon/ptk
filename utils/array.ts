import {bsearchNumber,bsearch} from "./bsearch.ts";
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
//assumng arr2 is sorted
export const xorStrings=(arr1:string[], arr2:string[], index) =>{
    const out=[];
    for (let i=0;i<arr1.length;i++) {
        const item=typeof index=='number'?arr1[i][index]:arr1[i];
        const at=bsearch(arr2, item);
        if (item!==arr2[at]) {
            out.push(arr1[i]);
        }
    }
    return out;
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
export const intersects=(arr: Array<NumberArray>):NumberArray=>{
    if (!arr || !arr.length) return [];
    let out=arr.shift();
    while (arr.length) {
        out=intersect(out,arr.shift());
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

// Jaccard similarity coefficient 
export const similarSet=( arr,  basearr)=>{
    const I=intersect(arr,basearr);
    const U=union(arr,basearr);
    return  I.length/U.length;
}

export const indexOfs=(arr,tofind)=>{
    const out=[];
    for (let j=0;j<arr.length;j++) {
        if (~arr[j].indexOf(tofind)) {
            out.push(j);
        }
    }
    return out;
}

export const groupNumArray=(arr,int)=>{
    let items=[];
    const out=[items];
    for (let i=0;i<arr.length;i++) {
        if (arr[i]==int) {
            items=[];
            out.push(items)
        } else {
            items.push(arr[i]);
        }
    }
    return out;
}