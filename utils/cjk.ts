export const isSurrogate=s=>s.codePointAt(0)>0xffff;

export const CJKRanges={
    'BMP': [0x4e00,0x9fa5],
    'ExtA':[0x3400,0x4dff],
    'ExtB':[0x20000,0x2A6FF],
    'ExtC':[0x2A700,0x2B73F],
    'ExtD':[0x2B740,0x2B81F],
    'ExtE':[0x2B820,0x2CEAF],
    'ExtF':[0x2CEB0,0x2EBE0],
    'ExtG':[0x30000,0x3134A]
}
export const enumCJKRangeNames=()=>Object.keys(CJKRanges);

export const getCJKRange=name=>CJKRanges[name]||[0,0];

export const CJKRangeName=s=>{//return cjk range name by a char or unicode number value or a base 16 string
    let cp=s;
    if (typeof s==='string') {
        const code=parseInt(s,16);
        if (!isNaN(code)) {
            cp=code;
        } else {
            cp=s.codePointAt(0);
        }
    }
    for (let rangename in CJKRanges) {
        const [from,to]=CJKRanges[rangename];
        if (cp>=from && cp<=to) return rangename;
    }
}
export const string2codePoint=(str, snap)=>{
    if (!str) return 0;
    const cp=str.codePointAt(0);
    let n;
    if (cp>=0x3400 && cp<0x2ffff) {
        n=cp; 
    } else {
        n=(parseInt(str,16)||0x4e00);
    }
    return snap? n&0x3ff80 : n;
}

export const isPunc=(str,full)=>{
    if (!str) return false;
    const cp=str.charCodeAt(0);
    // console.log(cp,str,full)
    return ((cp>=0x3001&&cp<=0x301f) || cp>0xff00)
}
export const trimPunc=str=>{
    return str.replace(/^[『「！。，：？]+/,'').replace(/[」？』。！：）｝〕；，]+$/,'');
}

const openBrackets="(「『（︹︵｛︷【︻《〈︽︿﹁﹃﹙﹛﹝‘“〝"; //closeBrackets are codepoint+1

export const closeBracketOf=(ch:string)=>{
    if (!ch)return;
    const at=openBrackets.indexOf(ch.slice(0,1));
    return ~at?String.fromCodePoint(1+openBrackets.codePointAt(at)):'';
}


export const cjkPhrases=str=>{
    const out=[];
    str.replace(/([\u2e80-\u2fd5\u3400-\u9fff\ud800-\udfff\ue000-\ufad9]+)/g,(m,m1)=>{
        out.push(m1);
    });
    return out;
}


export const extractAuthor=arr=>{
    const out=[]
    if (typeof arr=='string')arr=[arr];
    arr.forEach(str=>str.replace(/．([\u3400-\u9fff\ud800-\udfff]{2,10})[〈《]/g,(m,m1)=>out.push(m1)));
    return out;
}
export const extractBook=arr=>{
    const out=[]
    if (typeof arr=='string')arr=[arr]
    arr.forEach(str=>str.replace(/[〈《]([\u3400-\u9fff\ud800-\udfff]{2,30})/g,(m,m1)=>out.push(m1)));
    return out;
}
export const replaceAuthor=(str,cb)=>str.replace(/(．)([\u3400-\u9fff\ud800-\udfff]{2,10})([〈《])/g,(m,m1,m2,m3)=>cb(m1,m2,m3))
export const replaceBook=(str,cb)=>str.replace(/([〈《])([\u3400-\u9fff\ud800-\udfff]{2,30})/g,(m,m1,m2,m3)=>cb(m1,m2,''))