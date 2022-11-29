/* 引得市 缺字代碼 轉造字內碼 ，測試在 yapcheahshen/ebag/src/ebagseal.js */
/* 6 gaps
s066-599 򯿽 U+AFFFD
s066-600 򰀀 U+B0000

s132-199 򿿽 U+BFFFD
s132-200 󀀀 U+C0000

s197-798 󏿽 U+CFFFD
s197-799 󐀀 U+D0000
*/
export const toSeal=str=>{
    const m=str.match(/s?(\d\d\d)-?(\d\d\d)/);
    if (!m) return null;
    const part=parseInt(m[1])-1;
    const seq=parseInt(m[2])-1;
    let cp=part*999+seq;

    if (cp>=65534) cp+=2; // 65*99+599

    if (cp>=131068+2) cp+=2;
 
    if (cp>=196602+4) cp+=2;

    return String.fromCodePoint(0xA0000+cp)
}
export const fromSeal=ch=>{
    const cp=ch.codePointAt(0);
    if (cp<0xa0000 || cp>=0xd4320) return null;
    let n=cp-0xa0000;
    if (n>=65534) n-=2; 
    if (n>=131068) n-=2;
    if (n>=196602) n-=2;

    const part=Math.floor((n) / 999)+1;
    const seq= ((n) %999) + 1;
    return 's'+part.toString().padStart(3,'0')+'-'+seq.toString().padStart(3,'0');
}
