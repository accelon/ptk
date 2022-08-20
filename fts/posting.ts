let counter=0,maxspeed=0;
import {bsearchNumber} from '../utils/bsearch.js';
/*inspired by https://github.com/Siderite/SortedArrayIntersect AcceleratingIntersercter*/
export const plFind=(arr, v, p=0)=>{
    let speed = 1;
    let p2 = p;
    while (p2 < arr.length )  {
        if (v>arr[p2]) {
            speed++;
            if (speed>maxspeed)maxspeed=speed;
        } else  {
            if (speed <= 1) break;
            p2 -= speed;
            speed=1;
        }
        p2 += speed;
        counter++
    }
    return p2;
}

export const plAnd=(pl1:number[],pl2:number[],dist=1)=>{
    let p2 = 0 , c=0;
    if (pl1.length==0 ||pl2.length==0) return [];
    const sz=Math.min(pl1.length,pl2.length);
    let out=[];
    for (let p1=0;p1<pl1.length;p1++){
        let v1=pl1[p1]+dist;
        let v2=pl2[p2];
        while (v1>v2 && p2<pl2.length) v2=pl2[++p2];
        if (v1===v2) {
            out[c++]=v1-dist;
        }
    }
    return out.slice(0,c);
}
export const plCount=(pl:number[],plgroup:number[])=>{
    let p=0,start=0,end=0;
    const out=[];
    for (let i=0;i<plgroup.length;i++) {
        const [from,to]=plgroup[i];
        start=p;
        if (from>pl[p]) start=plFind(pl,from,p);
        end=start;
        while (pl[end]<to && end<pl.length) end++; 
        if (end>start) {
            out[i]=end-start;
        }
        p=end;
    }
    return out;
}
export const plTrim=(pl:number[],from:number,to:number)=>{
    const at1=bsearchNumber(pl,from);
    let at2=bsearchNumber(pl,to);
    if (pl[at2]<to) at2++;
    return pl.slice(at1,at2);
}
export const plRanges=(posting:number[],ranges:number[])=>{ // filter out postings by ranges
    if (!ranges||!ranges.length)return posting;
    const out=[];
    let j=0, r=ranges[j];
    for (let i=0;i<posting.length;i++) {
        const p=posting[i];
        if (p>=r[0] && r[1]>=p) out.push(p);
        while (p>r[0] && j<ranges.length-1){
            r=ranges[++j];
        }
        if (j>=ranges.length) break;
    }
    return out;
}
export const plContain=(posting:number[], ltp:number[], withHits=false)=>{ // return line containing posting
    let p,i=0,j=0;
    const lines=[], hits=[];
    while (i<posting.length ) {
        let p=posting[i];
        let at=bsearchNumber(ltp, p);
        if (at>=0 && at<ltp.length) {
            if (lines[lines.length-1]!==at) {
                lines.push(at);
            }
            if (withHits) {
                if (!hits[lines.length-1]) hits[lines.length-1]=[];
                hits[lines.length-1].push(p-ltp[at-1]);
            }
            p=posting[i];
        }
        i++;
    }
    return [lines, hits];
}
export const getCounter=()=>counter;
export const getSpeed=()=>maxspeed;
export const resetCounter=()=>counter=0;
export default {plAnd,plFind,getCounter,resetCounter,plRanges,plContain}