import {diffChars} from 'diff';
import {removeHeader,removeBold,spacify} from '../align/breaker.ts';

import {isPunc} from './cjk.ts'
import {red,green} from '../cli/colors.js'; // lukeed/kleur
const CJKWordEnd_Reg=/([\u2e80-\u2fd5\u3041-\u3096\u30a1-\u319f\u3400-\u9fff\ud400-\udfff\ue000-\ufadf\uc000-\ud7ff]+$)/;
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
    let out2='';
    d.forEach( ({added,value,removed})=>{
        if (!added && !removed) {
            out2+=value
        } else if (removed) {
            out2+=red(value);
        }
    })

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
const SENTENCESEP=String.fromCodePoint(0x2fff);
const SENTENCESEP1=String.fromCodePoint(0x2ffe);
export const diffBreak=(p1,p2,id,marker='<>')=>{//p1 cs(larger unit), p2(smaller unit,guiding text)
    let out='';
    const s1=p1.join(SENTENCESEP1), s2=p2.join(SENTENCESEP);
    const D=diffChars(s1,s2);
    for (let i=0;i<D.length;i++) {
        const d=D[i];
        let at=d.value.indexOf(SENTENCESEP);
        while (at>-1) {
            out+='\n';
            at=d.value.indexOf(SENTENCESEP,at+1);
        }
        if ( (!d.added && !d.removed) || d.removed) out+=d.value;
    }
    
    out=out.replace(/\n( *)\u2ffe/g,'$1\n'+marker) //確定p1換行符在行首
           .replace(/\u2ffe([ “‘]*)\n/g,'\n'+marker+'$1');
    if (out.indexOf(SENTENCESEP1)>0) {
        out=out.replace(/\u2ffe/g,'\n'+marker);//deal with leadch in the middle
    }
    //convert to breakpos
    const breaklines=out.split('\n'), breakpos=[];
    let linepos=[],offset=0, 
        ln=0; //line index of original text
    const regmarker=new RegExp(marker,"g");
    for (let i=0;i<breaklines.length;i++) {
        if (breaklines[i].substring(0,marker.length)===marker) {
            breakpos.push(linepos);
            offset=0;
            ln++;
            linepos=[];
        }
        let len=breaklines[i].replace(regmarker,'').length;
        if (offset>0) linepos.push(offset+ (p1[ln][offset-1]===' '?-1:0) ); //' \n' to '\n '
        offset+=len;
    }
    breakpos.push(linepos);

    while (p1.length>breakpos.length) breakpos.push([]);//make sure breakpos has same length
    return breakpos;
}

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


const leadN=(lines)=>{
    for (let i=0;i<lines.length;i++) {
        let line=lines[i];
        if (!~line.indexOf('^n')) continue;

        const m=line.match(/(.)(\^n\d+…*)$/); // …* workaround for dn3 n87, N08p0059a0901 分為 86,87兩段
        if (m) {
            //console.log('n at the end',line);
            lines[i]=m[2]+line.replace(/(.)(\^n\d+…*)$/,"$1");
        }
    }
}

export const aligncrlf=(c1:string,c2:string):String[]=>{
    if (~c1.indexOf('◒') || ~c1.indexOf('◓')) throw "cannot consist ◒◓ in f1";
    if (~c2.indexOf('◒') || ~c2.indexOf('◓')) throw "cannot consist ◒◓ in f2";
    const F1=c1.replace(/\r?\n/g, '◒').split(/(\^n\d+)/); 
    const F2=c2.replace(/\r?\n/g, '◓').split(/(\^n\d+)/); 

    if (F1.length!==F2.length) {
        throw "cannot align,  ^n unmatch";
    }
    const out=[];
    let n='';
    const needcheck={};
    for (let i=0;i<F1.length;i++) {
        if (F2[i].slice(0,2)=='^n') {
            n=F2[i].slice(2);
        } else { //make sure leading few bytes are same
            const lead1=F1[i].replace(/[◒◓]/g,'').replace(/\^[a-z]+\d*/g,'').slice(0,2);
            const lead2=F2[i].replace(/[◒◓]/g,'').replace(/\^[a-z]+\d*/g,'').slice(0,2);
            if (lead1!==lead2) {
                //console.log(n,lead1,lead2)
                if (!needcheck[n]) needcheck[n]=0;
                needcheck[n]+=100; //serious problem

            }
        }

        const D=diffChars(F2[i],F1[i]);
        for (let j=0;j<D.length;j++) {
            const d=D[j];
            if (!d.added && !d.removed) out.push(d.value);
            else if (d.added) out.push(d.value); //add all content in F2.
            else if (d.removed) {
                if (~d.value.indexOf('◓')) {
                    out.push(d.value.replace(/[^◓]/g,''))
                } else if (d.value.length) {
                    if (!needcheck[n]) needcheck[n]=0;
                    needcheck[n]++;
                }             
            }
        }
    }
    const outlines=out.join('').replace(/◒/g,'').split('◓');

    leadN(outlines);

    return outlines;
}

export default {diffCJK,printDiff,diffSim,diffBreak,compareText,aligncrlf,leadN};