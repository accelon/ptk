export const getOfftextLineClass=(ptk,offtext,attr)=>{
    const out=[];
    if (!offtext?.tags?.length) return [];
    const tags=offtext.tags;
    for (let i=0;i<tags.length;i++) {
        const tag=tags[i];
           const def=ptk.defines[tag.name];
        const value=def.attrs[attr];
        if (typeof value!=='undefined') {
            const backref=def.attrs.backref;
            //attr=value 在 ^:tag 中定義
            //strange , need to -1 other wise cannot render char at eol
            out.push({tagname:tag.name,
                attrs:tag.attrs,defattrs:def.attrs, id:tag.attrs.id,ptk,backref,attr,value,choff:tag.choff});
        }
    }
    // out.length&&console.log(out)
    return out;
}
