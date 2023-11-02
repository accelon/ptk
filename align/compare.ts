import {removeHeader,removeBold,spacify} from './breaker.ts';
import {diffSim} from '../utils/diff.ts';
import {diffChars, diffWords} from 'diff'

export const compareText=(F1,F2,opts)=>{
    const out=[];
    const ignoreBlank=opts.ignoreBlank||false;
    const ignorePeyyala=opts.ignorePeyyala||false;
    let min=opts.min||0.9;
    const longLength=opts.longLength||20;
    const longMin=opts.min*0.93;
    if (F1.length!==F2.length) {
        throw `line count unmatch f1:${F1.length} f2:${F2.length}`
    }
    for (let i=0;i<F1.length;i++) {
        const l1=spacify(removeBold(removeHeader(F1[i]))).replace(/ +/g,'');
        const l2=spacify(removeBold(removeHeader(F2[i]))).replace(/ +/g,'');
    
        if (l1.length>longLength || l2.length>longLength) min=longMin;
        const D=diffChars(l1,l2);
        const sim=diffSim(D);
        if(min>sim) {
            if (ignoreBlank && (!l1.trim().length || !l2.trim().length )) continue;
            if (ignorePeyyala && (F1[i].includes('…') || F2[i].includes('…'))) continue;
            out.push([i,sim,F1[i],F2[i]] );
        }
        if (out.length>50) break;
    }
    return out;
}

export default {compareText};