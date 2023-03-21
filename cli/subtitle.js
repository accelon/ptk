/* parse srt format */
import {filesFromPattern, writeChanged,readTextContent}  from '../nodebundle.cjs';

const guestSubtitleFormat=content=>{
    const m=content.match(/\d\d:\d\d:\d\d,\d\d\d --> \d\d:\d\d:\d\d,\d\d\d/);
    if (m) {
        return 'srt'
    }
}
const doSRT=content=>{
    return content.replace(/\n?(\d+ ?)\n(\d\d):(\d\d):(\d\d),\d\d\d --> \d\d:\d\d:\d\d,\d\d\d\n/g,(m0,n,h,m,s)=>{       
        const ts=parseInt(h)*3600+parseInt(m)*60+parseInt(s);
        return '^ts'+ts+' ';
    });
}
const Converters={
    'srt':doSRT
}
export const ts=(arg,arg2)=>{
    let files=[];
    if (fs.existsSync(arg)) {
        files=[arg]
    } else {
        files=filesFromPattern(arg||"*.srt");
    }
    if (!files.length) {
        console.log('no subtitle in cwd')
        return;
    }

    files.forEach((fn,idx)=>{
        const content = readTextContent(fn);
        const subtype=guestSubtitleFormat(content);
        if (!subtype || !Converters[subtype]) return;
        fn=fn.slice(0,fn.length-4);
        const out=Converters[subtype]( content);

        writeChanged( fn+'.off',('^ck#'+(idx+1)+'('+fn+')\n')+ out,true);
    })
}
