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
        if (ptk.lang===lang)return true;
    }
}
export const poolParallelPitakas=(ptk)=>{
    let align=ptk.attributes?.align;
    if (!align) align=ptk.name.replace(/\-[^-]+$/,'');
    const out=[];
    for (const n in _pool) {
        if (_pool[n].attributes.align==align || n.replace(/\-[^-]+$/,'')==align) {
            if (ptk.name!==_pool[n].name) out.push(n);
        }
    }
    return out;
}
