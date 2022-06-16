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