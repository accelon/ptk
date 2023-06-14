import {parseOfftext, readTextLines,writeChanged} from '../nodebundle.cjs'
export const addn=(arg,arg2)=>{
    let files=[];
    if (Array.isArray(arg)) {
        files=arg;
    } else {
        if (fs.existsSync(arg)) {
            files=[arg]
        } else {
            files=filesFromPattern(arg||"*.srt");
        }
        if (!files.length) {
            console.log('no subtitle in cwd')
            return;
        }    
    }

    files.forEach((fn)=>{
        const lines = readTextLines(fn);
        let n=0;
        for (let i=0;i<lines.length;i++) {
            
            const line=lines[i];
            let [text,tags]=parseOfftext(line);
            tags=tags.filter(it=>it.name=='ck');
            if (tags.length) {
                //tags[tags.length-1].attrs.id;
                n=0;
            } else {
                n++;
                lines[i]='^n'+n+' '+line;
            }
        }
        writeChanged( fn+'.ok',lines.join('\n'),true);

    })
}