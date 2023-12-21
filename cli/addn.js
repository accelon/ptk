import {parseOfftext, readTextLines,writeChanged} from '../nodebundle.cjs'
export const copyn=(arg,arg2)=>{
    const fromlines=readTextLines(arg);
    const tolines=readTextLines(arg2);
    if (fromlines.length!=tolines.length) {
        console.log('file line not same',fromlines.length,tolines.length);
        return;
    }

    for(let i=0;i<fromlines.length;i++) {
        const m=fromlines[i].match(/\^n(\d+)/);
        if (m) {
            const m2=tolines[i].match(/\^n(\d*)/);
            if (m2) { //overwrite the existing
                tolines[i]=tolines[i].replace(/\^n(\d*)/,'^n'+m[1]);
            } else {
                tolines[i]='^n'+m[1]+tolines[i];
            }
        }
    }

    writeChanged( arg2+'.ok',tolines.join('\n'),true);
}
export const addn=(arg,arg2)=>{
    let files=[];
    if (Array.isArray(arg)) {
        files=arg;
    } else {
        if (fs.existsSync(arg)) {
            files=[arg]
        } else {
            files=filesFromPattern(arg||"*.off");
        }
        if (!files.length) {
            console.log('no *.off in cwd')
            return;
        }    
    }

    files.forEach((fn)=>{
        const lines = readTextLines(fn);
        let n=0;
        for (let i=0;i<lines.length;i++) {
            const line=lines[i];
            let [text,tags]=parseOfftext(line);
            tags=tags.filter(it=>it.name=='ck' || it.name=='n');
            if (!tags.length) continue;
            if (tags[0].name=='ck') {
                n=1;
            } 
            if (tags.length==1 && tags[0].name=='n') {
                n++;
                lines[i]=lines[i].replace(/\^n(\d*)/,'^n'+n);
            }
        }
        writeChanged( fn+'.ok',lines.join('\n'),true);
    })
}