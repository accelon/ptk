import {readFileSync,writeFileSync} from 'fs'

const lines=readFileSync('Unihan_OtherMappings.txt','utf8').split(/\r?\n/);

let gb='';
lines.forEach(line=>{
    const m=line.match(/U\+([\dA-F]{4})\tkGB0/);
    if (m) {
        const uni=String.fromCharCode(parseInt(m[1],16));
        gb+=uni;
    }
})

writeFileSync('gb.txt',gb,'utf8');