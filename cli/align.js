import {aligncrlf,readTextLines, writeChanged,autoAlign, readTextContent } from "../nodebundle.cjs";

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

    const outcontent=aligncrlf(c1,c2);
    
     //use EMEDITOR to compare
    writeChanged(f1.replace('.off','-crlf.off'),outcontent.join('\n'),true)
}