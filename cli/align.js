import {readTextLines, writeChanged,autoAlign, readTextContent } from "../nodebundle.cjs";
import {diffChars} from 'diff';

export const align=(arg,arg2)=>{
    let f1=arg.replace(/\\/g,'/');
    let f2=arg2;
    if (!f1) throw "missing file 1"
    if (!f2) {
        f2='../sc/'+f1.replace(/([a-z]+)\.off$/,'ms.off')
        .replace(/[\-_a-z]+\.offtext\//,'sc-pli.offtext/') //for cs-pku.offtext
        .replace('off/','sc-pli.offtext/');
        if (!fs.existsSync(f2)) {
            throw "missing file 2 "+f2
        }
        console.log('guided by',f2)
    }
    const F1=readTextLines(f1);   
    const F2=readTextLines(f2);
    const out=autoAlign(F1,F2);

    writeChanged(f1+'.aligned',out.join('\n'),true)
}

const leadN=(lines)=>{
    for (let i=0;i<lines.length;i++) {
        let line=lines[i];
        if (!~line.indexOf('^n')) continue;

        const m=line.match(/(.)(\^n\d+…*)$/); // …* workaround for dn3 n87, N08p0059a0901 分為 86,87兩段
        if (m) {
            console.log('n at the end',line);
            lines[i]=m[2]+line.replace(/(.)(\^n\d+…*)$/,"$1");
        }
    }
}
export const crlf=(arg,arg2)=>{
    if (!arg) {
        console.log('syntax: file crlffilename')
        throw "missing file 1"
    }
    let f1=arg.replace(/\\/g,'/');
    let f2=arg2;
    if (!f2 && f1.includes('off-ori')) {
        f2=f1.replace('off-ori','off');
    }
    const c1=readTextContent(f1);
    const c2=readTextContent(f2);
    if (~c1.indexOf('◒') || ~c1.indexOf('◓')) throw "cannot consist ◒◓ in f1";

    if (~c2.indexOf('◒') || ~c2.indexOf('◓')) throw "cannot consist ◒◓ in f2";
    const F1=c1.replace(/\r?\n/g, '◒').split(/(\^n\d+)/); 
    const F2=c2.replace(/\r?\n/g, '◓').split(/(\^n\d+)/); 
    console.log('source',f1,'\ncrlf',f2)

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
     const outcontent=out.join('').replace(/◒/g,'').split('◓');

     leadN(outcontent);
     
     //use EMEDITOR to compare
     writeChanged(f1.replace('.off','-crlf.off'),outcontent.join('\n'),true)
}