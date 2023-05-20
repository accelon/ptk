export const isSurrogate=(s:string)=>(s.codePointAt(0)||0)>0xffff;

export const CJKRanges={
    'BMP': [0x4e00,0x9fa5],
    'ExtA':[0x3400,0x4dff],
    'ExtB':[0x20000,0x2A6FF],
    'ExtC':[0x2A700,0x2B73F],
    'ExtD':[0x2B740,0x2B81F],
    'ExtE':[0x2B820,0x2CEAF],
    'ExtF':[0x2CEB0,0x2EBE0],
    'ExtG':[0x30000,0x3134F],
    'ExtH':[0x31350,0x323AF],
    'ExtZ':[0xA0000,0xD47FF]
}
export const enumCJKRangeNames=()=>Object.keys(CJKRanges);

export const getCJKRange=(name:string)=>CJKRanges[name]||[0,0];

export const CJKRangeName=(s:string|number)=>{//return cjk range name by a char or unicode number value or a base 16 string
    let cp=0;
    if (typeof s==='string') {
        const code=parseInt(s,16);
        if (!isNaN(code)) {
            cp=code;
        } else {
            cp=s.codePointAt(0)||0;
        }
    }
    for (let rangename in CJKRanges) {
        const [from,to]=CJKRanges[rangename];
        if (cp>=from && cp<=to) return rangename;
    }
}
export const string2codePoint=(str:string, snap:boolean)=>{
    if (!str) return 0;
    const cp=str.codePointAt(0)||0;
    let n;
    if (cp>=0x3400 && cp<0x2ffff) {
        n=cp; 
    } else {
        n=(parseInt(str,16)||0x4e00);
    }
    return snap? n&0x3ff80 : n;
}

export const isPunc=(str:string)=>{
    if (!str) return false;
    const cp=str.charCodeAt(0);
    // console.log(cp,str,full)
    return ((cp>=0x3001&&cp<=0x301f) || cp>0xff00 || (cp>=0xfe10&&cp<=0xfe6b))
}
export const trimPunc=(str:string)=>{
    return str.replace(/^[『「！。，：？]+/,'').replace(/[」？』。！：）｝〕；，]+$/,'');
}
export const removePunc=(str:string)=>{
    return str.replace(/[！。、：；，？！（）《》｛｝〔〕『』「」]/g,'');
}
//EMEDITOR highlight \^([#@\/\.\:a-z_\-\d~]+)([<\(「『〔（︹︵︷【︻《〈︽︿﹁﹃﹙﹝‘“〝](?:\\.|.)*?[>\)」』〕）︺︶︸】︼》〉︾﹀﹂』﹚﹞’”〞])?
const openBrackets="(「『〔（︹︵︷【︻《〈︽︿﹁﹃﹙﹝‘“〝"; //closeBrackets are codepoint+1

export const closeBracketOf=(ch:string)=>{
    if (!ch)return;
    const at=openBrackets.indexOf(ch.slice(0,1));
    return ~at?String.fromCodePoint(1+(openBrackets.codePointAt(at)||0)):'';
}
export const removeBracket=(str:string)=>{
    const closebracket = closeBracketOf(str);
    if (closebracket && str.slice(str.length-1)==closebracket) {
        return str.slice(1,str.length-1);
    }
    return str;
}

export const cjkPhrases=(str:string)=>{
    const out=[];
    str.replace(/([\u2e80-\u2fd5\u3400-\u9fff\ud800-\udfff\ue000-\ufad9]+)/g,(m,m1)=>{
        out.push(m1);
    });
    return out;
}

export const cjkSplitPuncs=(str:string)=>{
    const out=[];
    let prev=0;
    str.replace(/([\u3001-\u301f\uff00-\ufffc]+)/g,(m,m1,idx)=>{
        out.push(str.slice(prev,idx));
        out.push(m1);
        prev=idx+m1.length;
    });
    out.push(str.slice(prev));
    return out;
}

export const extractAuthor=(arr:Array<string>|string)=>{
    const out=[]
    if (typeof arr=='string')arr=[arr];
    arr.forEach(str=>str.replace(/．([\u3400-\u9fff\ud800-\udfff]{2,10})[〈《]/g,(m,m1)=>out.push(m1)));
    return out;
}
export const extractBook=(arr:Array<string>|string)=>{
    const out=[]
    if (typeof arr=='string')arr=[arr]
    arr.forEach(str=>str.replace(/[〈《]([\u3400-\u9fff\ud800-\udfff]{2,30})/g,(m,m1)=>out.push(m1)));
    return out;
}
export const replaceAuthor=(str:string,cb:Function)=>str.replace(/(．)([\u3400-\u9fff\ud800-\udfff]{2,10})([〈《])/g,(m,m1,m2,m3)=>cb(m1,m2,m3))
export const replaceBook=(str:string,cb:Function)=>str.replace(/([〈《])([\u3400-\u9fff\ud800-\udfff]{2,30})/g,(m,m1,m2,m3)=>cb(m1,m2,''))

const textlength=str=>{
    return str.replace(/\^[a-z:\d\.\-@#]+/g,'').replace(/<[^>]+/g,'').length;
}
export const breakChineseSentence=(line,opts={})=>{
    const max=opts.threshold||22;
    const mid=opts.threshold||14;
    const min=opts.threshold||6;

    let thres=0 , t='' ;
    const phrases=cjkSplitPuncs(line);
    const out=[]
    for (let i=0;i<phrases.length/2;i++) {
        const nonpunc=phrases[i*2];
        let punc=phrases[i*2+1]||'';
        const strongbreak=punc.match(/[。！？]/) || nonpunc.slice(0,2)=='^k';//「『﹁﹃‘“〝‵

        const nextstrongbreak= (phrases[(i+1)*2+1]||'').match(/[。！？]/);
        thres+=  textlength(nonpunc);
        t+=nonpunc+punc;        
        if (t && (thres > max || (thres>mid&&!nextstrongbreak)|| (thres>min && strongbreak) )) {
            out.push(t);
            t='';
            thres=0;           
        }
    }
    t&&out.push(t);
    //move open tag to next line
    const out2=[];
    let lead='';
    for (let i=0;i<out.length;i++) {
        const m=out[i].match(/([（《「『︵｛︷〔︹【︻︽〈︿﹃﹙﹛﹝‘“〝‵]+)$/);
        if (m) {
            out2.push( lead+out[i].slice(0,out[i].length - m[1].length));
            lead=m[1];
        } else {
            out2.push(lead+out[i]);
            lead=''
        }
    }

    if (lead&&out2.length) out2[out2.length-1]+=lead;

    return out2.join('\n')
    .replace(/\n(\^[jkf][#a-z\d@:\-]+)([：；，、。！？」』）〕】》]*)/g,(m,m1,punc)=>m1+(punc||'')+'\n')
    .replace(/\n+/g,'\n').trimEnd(); //remove tailing \n and blanks
}