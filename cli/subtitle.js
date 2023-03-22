/* parse srt format */
import {filesFromPattern, writeChanged,readTextContent}  from '../nodebundle.cjs';

const guestSubtitleFormat=content=>{
    const m=content.match(/\d\d:\d\d:\d\d,\d\d\d --> \d\d:\d\d:\d\d,\d\d\d/);
    if (m) {
        return 'srt'
    }
}
const doSRT=content=>{
    return content.replace(/\n?(\d+ ?)\n(\d+):(\d\d):(\d\d),(\d\d\d) --> (\d+):(\d\d):(\d\d),(\d\d\d)\n/g,(m0,n,h,m,s,f,h2,m2,s2,f2)=>{
        //亞秒
        const start=Math.floor((parseInt(h)*3600+parseInt(m)*60+parseInt(s)+(parseInt(f)/1000))*10);
        const end=Math.floor((parseInt(h2)*3600+parseInt(m2)*60+parseInt(s2)+(parseInt(f2)/1000))*10);
        if (start>end) {
            throw "end > start "
        }
        return '^ts'+start+'-'+ (end-start)+' ';
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

        writeChanged( fn+'.off',('^ck#'+(idx+1)+'('+fn+')\n')
        + '^mpeg<id='+fn+'>\n'
        + out,true);
    })
}
