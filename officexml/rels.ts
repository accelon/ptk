export const getRels=(children,ctx)=>{
    const out={};
    for (let i=0;i<children.length;i++) {
        const attrs=children[i].attrs;
        if (!attrs) continue;
        let target=(attrs['Target']||'')
        .replace('.docx','')
        .replace('../law/','')
        .replace('../law1/','')
        .replace('../law2/','')
        .replace('../law3/','')

        if (ctx.idmap[target]) target=ctx.idmap[target];
        if (target)out[ attrs['Id']] =  target;
    }  
    return out;
}