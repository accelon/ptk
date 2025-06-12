import {readFileSync,writeFileSync} from 'fs'

const lines=readFileSync('Unihan_OtherMappings.txt','utf8').split(/\r?\n/);

let big5='';
lines.forEach(line=>{
    const m=line.match(/U\+([\dA-F]{4})\tkBigFive/);
    if (m) {
        const uni=String.fromCharCode(parseInt(m[1],16));
        big5+=uni;
    }
})

writeFileSync('big5.txt',big5,'utf8');