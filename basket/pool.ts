let _pool={};

export const poolHas=(name:string)=>!!_pool[name];
export const poolGet=(name:string)=>_pool[name];
export const poolAdd=(name:string,inst)=>_pool[name]=inst;
export const poolDel=(name:string)=>delete _pool[name];
export const poolGetAll=()=>{
    const out=[];
    for (const name in _pool) {
        out.push(_pool[name]);
    }
    return out;
}
export const hasLang=(lang:string)=>{
    for (const name in _pool) {
        const ptk=_pool[name];
        if (ptk.header.lang===lang)return true;
    }
}
export const poolParallelPitakas=(ptk)=>{
    const at=ptk.name.indexOf('-');
    const out=[];
    const suffix=~at?ptk.name.slice(0,at):ptk.name;
    for (const n in _pool) {
        if (n.startsWith(suffix) && n!==ptk.name) {
            out.push(n);
        }
    }
    return out;
}
