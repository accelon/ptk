import {diffChars} from 'diff';
import {isPunc} from './cjk.ts'
import {red,green} from '../cli/colors.cjs'; // lukeed/kleur

const CJKWordEnd_Reg=/([\u2e80-\u2fd5\u3400-\u9fff\ud400-\udfff\ue000\ufadf]+$)/;
export const diffCJK=(qstr, source, x,w)=>{ //source text is longer than qstr
    let qsrc=source.substr(x,w), adjusted=false;
    let d=diffChars(qstr, qsrc);

    if (d[0].removed || d[0].added) { //開頭有差異
        let trimcount=d[0].value.length;
        if (d[1]&&d[1].added) {
            const m=d[1].value.match(CJKWordEnd_Reg); //往左到第一個非中文字。
            if (m && m[1].length<d[1].value.length) {
                trimcount=d[1].value.length-m[1].length;
            } else if (d[1].value.length>d[0].value.length){
                trimcount=d[1].value.length-d[0].value.length;
            }
        }
        if (trimcount) adjusted=true;
        x+=trimcount;
        w-=trimcount;    
    }
    if (d[d.length-1].added) { //最後多出來的部份
        let trimcount=d[d.length-1].value.length;
        if (d[d.length-2] &&d[d.length-2].removed) { 
            trimcount-=d[d.length-2].value.length; //是替代某幾個字
        }
        w-=trimcount;
        if (trimcount) adjusted=true;
    }
    const same=d.filter(dd=> (!dd.added && !dd.removed)).reduce( (p,dd)=>dd.value.length+p,0);
    const sim=same/qstr.length;
    if (sim<0.7) return [d,0,0]; //no equal  太多字不同
    if (!source[x+w] ||x+w>source.length) w=source.length-x-1;
    while (w&&isPunc(source[x+w-1],source.substr(x,w))) w--;
    if (adjusted) {
        qsrc=source.substr(x,w);
        d=diffChars(qstr,qsrc);
    }
    return [d,x,w,sim]
}
export const printDiff=(d,caption)=>{
    let out='';
    d.forEach( ({added,value,removed})=>{
        if (!added && !removed) {
            out+=value
        } else if (added) {
            out+=green(value);
        }
    })
    console.log(caption);
    console.log(out);
    let out2='';
    d.forEach( ({added,value,removed})=>{
        if (!added && !removed) {
            out2+=value
        } else if (removed) {
            out2+=red(value);
        }
    })
    console.log(out2)
}
export const diffSim=D=>{
    let same=0,total=0;
    for (let i=0;i<D.length;i++) {
        const d=D[i];
        if (!d.added && !d.removed) {
            same+=d.value.length*2;
            total+=d.value.length*2;
        } else total+= d.value.length;
    }
    return same/total;
}
export default {diffCJK,printDiff,diffSim};