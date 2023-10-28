import {diffChars} from 'diff';

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