export const forEachUTF32=(str:string,cb:Function) :void=>{
    let i=0;
    while (i<str.length) {
        const code=str.codePointAt(i)||0;
        const ch=String.fromCodePoint(code);
        cb(ch,i,str);
        i++;
        if (code>0xffff) i++;
    }
}
export const splitUTF32=(str:string):number[]=>{
    if (!str) {
        const empty:number[]=[];
        return empty
    }
    let i=0;
    const out:number[]=[];
    while (i<str.length) {
        const code=str.codePointAt(i)||0;
        out.push(code);
        i++;
        if (code>0xffff) i++;
    }
    return out;
}
export const splitUTF32Char=(str:string)=>splitUTF32(str).map( cp=>String.fromCodePoint(cp));
export const codePointLength=(str:string)=>splitUTF32(str).length;
export const StringByteLength=(str:string)=>new Blob([str]).size;
export const UnicodeBlock=(n:number|string)=>{
    if (!n) return '';
    const cp=(typeof n=='string') ?n.codePointAt(0):cp;
    if (cp<0x80) return '半形 ascii';
    else if (cp<0x400) return '2位元拉丁字母 2b Latin';
    else if (cp<0x900) return '其他 Miscellaneous';
    else if (cp<0xd80) return '印度 Indic scripts';
    else if (cp<0xdf0) return '斯里兰卡Sinhala';
    else if (cp<0xe80) return '泰 Thai';
    else if (cp<0xf00) return '老挝 Lao';
    else if (cp<0x1000) return '藏 Tibet';
    else if (cp<0x1100) return '缅 Myanmar';
    else if (cp<0x1200) return '韩 Korean';
    else if (cp<0x1780) return '其他 Miscellaneous';
    else if (cp<0x1800) return '柬埔寨 Khemar';
    else if (cp<0x18D0) return '蒙 Mongolian';
    else if (cp<0x2000) return '符号 Symbols';
    else if (cp<0x2E80) return '其他 Miscellaneous';
    else if (cp<0x2FF0) return '部首 Radical';
    else if (cp<0x3000) return '组字符 IDC';
    else if (cp<0x3100) return '日文 Japanese';
    else if (cp<0x3140) return '注音 Bopomofo';
    else if (cp<0x31D0) return '韩 Korean';
    else if (cp<0x31F0) return '笔划 Strokes';
    else if (cp<0x3400) return '机种依存文字 Kisyu-izon-moji';
    else if (cp<0x4E00) return '扩A';
    else if (cp<0xA000) return '基本汉字';
    else if (cp<0xA4D0) return '彝 Yi';
    else if (cp<0xAC00) return '其他 Miscellaneous';
    else if (cp<0xE000) return '韩 Korean';
    else if (cp<0xFAE0) return '造字区 Private Use Area';
    else if (cp<0x10000) return  '标点 Puncuation';
    else if (cp<0x20000) return '其他 Miscellaneous';
    else if (cp<0x2A7D0) return '扩B';
    else if (cp<0x2B7A0) return '扩C';
    else if (cp<0x2B880) return '扩D';
    else if (cp<0x2CF10) return '扩E';
    else if (cp<0x2FFFF) return '扩F';
    else if (cp<0x40000) return '扩G';
}