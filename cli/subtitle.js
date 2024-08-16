/* parse srt format */
import {filesFromPattern, writeChanged,readTextContent}  from '../nodebundle.cjs';
import {red,cyan} from './colors.js';
const guestSubtitleFormat=content=>{
    const m=content.match(/\d\d:\d\d:\d\d,\d\d\d --> \d\d:\d\d:\d\d,\d\d\d/);
    if (m) {
        return 'srt'
    }
}
const doSRT=(content,filename)=>{
    return content.replace(/\n?(\d+ ?)\n(\d+):(\d\d):(\d\d),(\d\d\d) --> (\d+):(\d\d):(\d\d),(\d\d\d)\n/g,(m0,n,h,m,s,f,h2,m2,s2,f2)=>{
        //亞秒
        const start=Math.floor((parseInt(h)*3600+parseInt(m)*60+parseInt(s)+(parseInt(f)/1000))*10);
        let end=Math.floor((parseInt(h2)*3600+parseInt(m2)*60+parseInt(s2)+(parseInt(f2)/1000))*10);
        if (start>end) {
            console.log(cyan(filename)+"\nInvalid Timestamp "+red(`${h}:${m}:${s},${f} --> ${h2}:${m2}:${s2},${f2}`));
            end=start+20;//自動改為2秒
        }
        return '^ts'+start+'-'+ (end-start)+' ';
    });
}
const Converters={
    'srt':doSRT
}

export const convertSubtitle=(content,fn)=>{
    const subtype=guestSubtitleFormat(content);
    if (!subtype || !Converters[subtype]) return '';
    const out=Converters[subtype]( content,fn); 
    return out;
}

export const ts=(arg,arg2)=>{
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

    files.forEach((fn,idx)=>{
        const content = readTextContent(fn);
        out=convertSubtitle(content,fn);

        fn=fn.slice(0,fn.length-4);

        writeChanged( fn+'.off',('^ck#'+(idx+1)+'('+fn+')\n')
        + '^mpeg<id='+fn+'>\n'
        + out,true);
    })
}
