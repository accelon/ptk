let _pool={};

export const poolHas=name=>!!_pool[name];
export const poolGet=name=>_pool[name];
export const poolAdd=(name,inst)=>_pool[name]=inst;
export const poolGetAll=()=>{
    const out=[];
    for (let name in _pool) {
        out.push(_pool[name]);
    }
    return out;
}
export const hasLang=lang=>{
    for (let name in _pool) {
        const ptk=_pool[name];
        if (ptk.header.lang===lang)return true;
    }
}
