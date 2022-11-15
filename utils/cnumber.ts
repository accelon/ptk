export const headerWithNumber = [
    /第([一二三四五六七八九十百千○〇零]+)[回章卷品節]*/,
    /卷([一二三四五六七八九十百千○〇零]+)/,
    /卷第([一二三四五六七八九十百千○〇零]+)/,
]
export const isChineseNumber=(str:string,pat:string)=>{
    pat=pat||/[一二三四五六七八九十百千○〇]+/
    return str.replace(pat,'')=='';
}
export const fromChineseNumber=(str:string)=>{
    return parseInt(str
    .replace(/百([二三四五六七八九])十/,'$1十')
    .replace(/百十$/,'10')
    .replace(/百十/,'1')
    .replace(/百$/,'00')
    .replace(/百/,'0')
    .replace(/一/g,'1')
    .replace(/二/g,'2')
    .replace(/三/g,'3')
    .replace(/四/g,'4')
    .replace(/五/g,'5')
    .replace(/六/g,'6')
    .replace(/七/g,'7')
    .replace(/八/g,'8')
    .replace(/九/g,'9')
    .replace(/^十$/,'10')
    .replace(/^十/,'1')
    .replace(/十$/,'0')
    .replace(/十/,'')
    .replace(/[○〇零]/g,'0'));
}
export const isChineseChapter=(str:string)=>{
    for (let i=0;i<headerWithNumber.length;i++) {
        const pat=headerWithNumber[i];
        const m=str.match(pat);
        if (m) {
            return fromChineseNumber(m[1]);
        }
    }
    return null;;
}
export const extractChineseNumber=(str:string,firstnum=false)=>{
    let cn='';
    for (let i=0;i<headerWithNumber.length;i++) {
        const pat=headerWithNumber[i];
        const m=str.match(pat);
        if (m) cn=fromChineseNumber(m[1]);
    }
    if (!cn) {
        const m=str.match(/^([一二三四五六七八九十○百零]+)$/);
        if (m) cn=fromChineseNumber(m[1]);
    }
    return cn;
}
const StyledNumber1={'Ⅰ':10,'ⅰ':10,'⒜':26,'Ⓐ':26,'ⓐ':26,'⓫':10,'㉑':15,'㍘':25,'㍙':24,'㈠':10,
'㊀':10,'㋀':12,'㏠':31,'①':20,'⑴':20,'⒈':20,'⓵':10,'❶':10,'➀':10,'➊':10}
export const styledNumber=(n,style,offset=1)=>{
    const max=StyledNumber1[style];
    if (!max) { //u
        return n.toString(); //fall back
    } else {
        if ((n-offset)>=max) {
            return n.toString();
        }
        let code=style.charCodeAt(0) + n - offset;
        return String.fromCharCode(code);
    }
}

const ForeignNumbers={'၀':true,'०':true,'๐':true,'໐':true,'០':true,'༠':true}
export const foreignNumber=(n:number,style:string)=>{
    const s=n.toString();
    const zero=ForeignNumbers[style];
    if (!zero) return s;
    const base=style.charCodeAt(0);
    let out='';
    for (let i=0;i<s.length;i++) {
        out+=String.fromCharCode(s.charCodeAt(i)-0x30 + base);
    }
    return out;
}