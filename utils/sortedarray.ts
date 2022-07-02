export const alphabetically=(a:string,b:string)=>a>b?1: ((a<b)?-1:0);
export const alphabetically0=(a:string,b:string)=>a[0]>b[0]?1: ((a[0]<b[0])?-1:0);
export const alphabetically1=(a:string,b:string)=>a[1]>b[1]?1: ((a[1]<b[1])?-1:0);
export const alphabetically2=(a:string,b:string)=>a[2]>b[2]?1: ((a[2]<b[2])?-1:0); 
//rename to lexicographically 
export const length_alphabetically=(a:string,b:string)=> a.length==b.length?(a>b?1: ((a<b)?-1:0)):a.length-b.length;
export const length_alphabetically0=(a:string,b:string)=>a[0].length==b[0].length?(a[0]>b[0]?1: ((a[0]<b[0])?-1:0)):a[0].length-b[0].length;
export const length_alphabetically1=(a:string,b:string)=>a[1].length==b[1].length?(a[1]>b[1]?1: ((a[1]<b[1])?-1:0)):a[1].length-b[1].length;

export const dedup=(arr:string[],dups:string[]|null)=>{
    arr.sort(alphabetically);
    const out=[arr[0]];
    for (let i=1;i<arr.length;i++) {
        if (arr[i]!==arr[i-1]) {
            out.push(arr[i])
        } else if (dups) {
            dups?.push(arr[i]);
        }
    }
    return out;
}
export const unique=(arr:string[],sorted=false)=>{
    if (!arr||!arr.length)return [];
    if(!sorted) arr.sort(alphabetically);
    let prev,out=[];
    for (let i=0;i<arr.length;i++) {
        if (arr[i]!==prev) out.push(arr[i]);
        prev=arr[i];
    }
    return out;
}
export const unique1=(arr:string[],sorted=false)=>{
    if (!arr||!arr.length)return [];
    if(!sorted) arr.sort(alphabetically1);
    const out=[arr[0]];
    for (let i=1;i<arr.length;i++) {
        if (arr[i][1]!==arr[i-1][1]) {
            out.push(arr[i])
        }
    }
    return out;
}
export const unique0=(arr:string[],sorted=false)=>{
    if(!sorted) arr.sort(alphabetically0);
    const out=[arr[1]];
    for (let i=1;i<arr.length;i++) {
        if (arr[i][0]!==arr[i-1][0]) {
            out.push(arr[i])
        }
    }
    return out;
}
interface IntergerMap {
  [key: string]: number 
}
interface Map {
    [key: string] : any
}
type StringNumber = [string,number] ;
type NumberString= [number, string] ;
export const statStrIntobject=(o:IntergerMap)=>{
    const out:NumberString[]=[];
    for (const key in o) {
        out.push([o[key],key]);
    }
    out.sort((a,b)=> b[0]-a[0]);
    return out;
}

export const fromObj=(obj:Map,cb:Function|null)=>{
    const arr=[];
    for (let key in obj) {
        if (!cb) {
            arr.push(key+'\t'+obj[key] );
        } else {
            if (typeof cb=='function') {
                arr.push( cb(key,obj[key]) );
            } else {
                arr.push( [key,obj[key]] );
            }
        }
    }
    if (cb && typeof cb!=='function') {
        arr.sort((a,b)=>b[1]-a[1]);
    }
    return arr;
}
type SortNumberFunction =(x: (string|number)[], y: (string|number)[] ) => number ;
export const sortObj=(obj:IntergerMap,func?:SortNumberFunction)=>{
    const arr:StringNumber[]=[];
    for (let key in obj) {
        arr.push( [key,obj[key]] );
    }
    if (func) arr.sort(func);
    else arr.sort((a,b)=> {
        return +b[1]! -a[1] 
    });
    return arr;
}
export const toObj=(arr:string[])=>{
    const obj:IntergerMap={};
    for (let i=0;i<arr.length;i++) {
        if (!obj[arr[i]])obj[arr[i]]=0;
        obj[arr[i]]! ++;
    }
    return obj;    
}

export const incObj=(obj:IntergerMap,key:string)=>{
    if (!obj[key]) obj[key]=0;
    obj[key]! ++;
}
export const groupArr=(arr:string[])=>{
    return sortObj( toObj(arr));
}
export const fillGap=(sorted_int_array:number[])=>{
    let prev=sorted_int_array[0]||0;
        
    for (let i=1;i<sorted_int_array.length;i++) { //fill the gap
        if (isNaN(sorted_int_array[i])) sorted_int_array[i]=prev;
        prev=sorted_int_array[i];
    }
    return sorted_int_array;
}