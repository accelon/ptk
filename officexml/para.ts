export const dumprun=(wr)=>{
    let out='';
    for (let i=0;i<wr.children.length;i++) {
        const item=wr.children[i];
        if (item.name=='w:t'){            
            out+=item.children[0]||'';
            if (item.attrs['@_xml:space']=='preserve') {
                out+='　';
            }
        } else if (item.name=='w:rPr') {
            //console.log(item)
        }        
    }
    return out;
}

export const dumppara=(para,ctx)=>{
    let out='';
    if (!para)return;
    const openpara=ctx.openhandlers['w:p'];
    const closepara=ctx.openhandlers['w:p'];
    out+= openpara?openpara(para.attrs):''
    for (let i=0;i<para.children.length;i++) {
        const child=para.children[i];
        const attrs=child.attrs||{};
        const open=ctx.openhandlers[child.name];
        const close=ctx.closehandlers[child.name];
        
        if (child.name=='w:r') {
            out+=dumprun(child);
        } else if (child.name=='w:hyperlink') {
            let arr=child.children;
            //憲法 第22條（基本人權保障）相關解釋 nested hyperlink
            out+=open(attrs)
            let h='';
            if (arr[0]?.name=='w:hyperlink') {
                for (let j=0;j<arr[0].children.length;j++) {
                    h+= dumprun(arr[0].children[j]);
                }                
            }
            for (let j=0;j<arr.length;j++) {
                if (arr[j].name=='w:r') h+= dumprun(arr[j]);
            }
            out+=h;
            out+=close(attrs)
        } else if (child.name=='w:pPr') {
             for (let i=0;i<child.children.length;i++) {
                const node=child.children[i];
                if (node.name=='w:pStyle' && node.attrs['w:val']) {
                    out+=ctx.openhandlers['w:pStyle'](node.attrs)
                }
             }
        } else if (child.name=='w:bookmarkStart') {
            out+=open(attrs)
        }
    }
    out+=closepara?closepara(para.attrs):''
    out=ctx.onPara?ctx.onPara(ctx,out):'';
    return out;
}