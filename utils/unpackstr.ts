const CodeStart=0x0E,CodeEnd=0x1F;
export const unpackStrings=(str:string)=>{
    let p=0, s='', prevstr='',shared=0;
    const out=[];
    
    while (p<str.length) {
        const code=str.charCodeAt(p);
        if (code>=CodeStart && code<=CodeEnd) {
            if (shared || s){
                prevstr=prevstr.substr(0,shared)+s;
                out.push(prevstr);
            }
            shared=code-CodeStart;
            s='';
        } else {
            s+=str[p];
        }
        p++; 
    }
    if (s) out.push(prevstr.substr(0,shared)+s);
    return out;
}
