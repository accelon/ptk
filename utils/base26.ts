/* convert a number to a-z , base 26 */
export const toBase26=(num:number):string=>{
    const str = num.toString(26).toLowerCase();
    let out='';
    for (let i=0;i<str.length;i++) {
        const code=str.charCodeAt(i);
        if (code>=0x30 &&code<0x40) {
            out+=String.fromCharCode(code-0x30+0x61);//0=>a , 1=>b start from a
        } else {
            out+=String.fromCharCode(code+10);// a => k and so on
        }
    }
    return out;
}
export const fromBase26=(str:string):number=>{
    let out='';
    str=str.toLowerCase();
    for (let i=0;i<str.length;i++) {
        const code=str.charCodeAt(i)-0x61;
        if (code<10) {
            out+=String.fromCharCode(code+0x30);
        } else {
            out+=String.fromCharCode(code-10+0x41);
        }
    }
    return parseInt(out,26);
}

export default {toBase26,fromBase26}