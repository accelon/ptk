const ctx={
rels:{},
ext:'md',
fn:'',
openhandlers:{
    'w:hyperlink':attrs=>{
        const anchor=attrs['w:anchor'];
        const id=attrs['r:id']||'';
        //convert hyperlink id to slink internal id(allnames)
        const linktarget=(id&&!isNaN(parseInt(ctx.rels[id])))?'@'+ctx.rels[id]:id;
        ctx.link=linktarget + (anchor?'#^'+anchor:'');
        return '[['+ctx.link+'|';
    },
    'w:pStyle':attrs=>{
        const heading=parseInt(attrs['w:val'])||0;
        return '#'.repeat(heading)+' ';
    },
    'w:bookmarkStart':attrs=>'<a name="'+attrs['w:name']+'">',
    'w:p':attrs=>'\n'
},
closehandlers:{
    'w:hyperlink':()=>']]'
}
}
export default ctx;