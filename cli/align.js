import {readTextLines, writeChanged } from "../nodebundle.cjs";

const align=(arg,arg2)=>{
    let f1=arg;
    let f2=arg2;
    if (!f1) throw "missing file 1"
    if (!f2) {
        f2=defaultGuideFolder+f1;
        if (!fs.existsSync(f2)) {
            throw "missing file 2 "
        }
    }
    const F1=readTextLines(f1);
    const F2=readTextLines(f2);

    const out=autoAlign(F1,F2);

    if (writeChanged(f1+'.aligned',out.join('\n'))) {
        console.log('written',f1+'.aligned')
    }
}