import {devanagari,myanmar,thai,khmer,laos,sinhala,tibetan} from './tables.js';
export const DEVAPAT=/([ऀ-ॿ]+)/;
export const DEVAPAT_G=/([ऀ-ॿ]+)/g;
const inverseTable=tbl=>{
    const out={};
    for (let key in tbl) out[ tbl[key] ]=key;
    return out;
}

const tables={
    hi:inverseTable(devanagari), my:inverseTable(myanmar),
    th:inverseTable(thai),       km:inverseTable(khmer),
    lo:inverseTable(laos),       si:inverseTable(sinhala),
    tb:inverseTable(tibetan) //,    cy:inverseTable(cyrillic),
}
export const enumTransliteration=()=>Object.keys(tables);
export const convertToIndic=(content,table)=>{ //pure text, no tag
    let i=0,out=[];
    if (!content) return '';
    while (i<content.length) {
        let o= table[ (content[i]+content[i+1])]
        if (o) {
            i++;
        } else o=table[content[i]];
        if (o) {
            if (content[i]==='N' && content[i+1]==='V') {
                const c=content[i+2];
                if (c==='k'||c=='K'||c=='g'||c==='G') {
                    o=table.NG;
                    if (table==tables.my) {
                        //https://viss.wordpress.com/2015/05/17/how-to-transcribe-pa%E1%B8%B7i-in-lanna-and-burmese/
                        o+=String.fromCharCode(0x103a);//ASAT 
                    }
                }
            }
            out+=o; 
        } else out+=content[i];
        i++;
    }
    return out;
}

export const toIndic=(content,lang='hi')=>{
    const table=tables[lang];
    return table?convertToIndic(content,table):content;
}

export const toIndicXML=(content,lang='hi')=>{
    let out='';
    const parts=content.split(/(<[^<]+>)/);
    for (let j=0;j<parts.length;j++) {
        if (parts[j][0]=='<') {
            out+=parts[j];
            continue;
        }
        const units=parts[j].split(/([a-zA-Z]+)/);
        units.forEach(s=>{
            const m=s.match(/[a-zA-Z]/);
            if (!m) {
                out+=s;
            } else {
                out+=toIndic(s,lang);    
            }
        })
    }
    return out;
}

//for importing CST
export const fromDevanagariWord=w=>{ //w must me a pure devanagari word
    let out='';
    for (let i=0;i<w.length;i++) {
        let ch=devanagari[w[i]];
        if (ch=='NG') ch='N'; //ङ ण share same code
        if (typeof ch=='undefined') {
            console.log('wrong deva char',w[i],w);
        } else {
            out+=ch;                   
        }
    }
    return out;
}
export const fromDevanagari=content=>{
    const tokens=content.split(DEVAPAT);
    let out='';
    tokens.forEach(tk => {
        if (!tk.match(DEVAPAT)) {
            out+=tk;
        } else {
            out+=fromDevanagariWord(tk)
        }
    });
    out=out.replace(/\u200d/g,'');
    out=out.replace(DEVAPAT_G,''); //drop all unknown
    return out;
}


export default {convertToIndic,toIndic,toIndicXML,fromDevanagari,enumTransliteration}