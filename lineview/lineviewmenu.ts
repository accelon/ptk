export const getOfftextLineClass=(ptk,offtext,attr)=>{
    const out=[];
    if (!offtext.tags.length) return [];
    const tags=offtext.tags;
    for (let i=0;i<tags.length;i++) {
        const tag=tags[i];
        const def=ptk.defines[tag.name];
        const value=def.attrs[attr];
        if (typeof value!=='undefined') {
            const backlink=def.attrs.backlink;
            //attr=value 在 ^:tag 中定義
            out.push({tagname:tag.name,ptk,backlink,attr,value});
        }
    }
    // out.length&&console.log(out)
    return out;
}
