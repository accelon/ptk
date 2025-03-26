const ctx={
rels:{},
ext:'off',
fn:'',
openhandlers:{
    'w:hyperlink':attrs=>{
        const anchor=attrs['w:anchor'];
        const id=attrs['r:id']||'';
        //convert hyperlink id to slink internal id(allnames)
        const linktarget=(id&&!isNaN(parseInt(ctx.rels[id])))?ctx.rels[id]:id;
        return '^a{ln:"'+linktarget + (anchor?'",id:"'+anchor.replace(/^a/,''):'')+'"}['
    },
    'w:pStyle':attrs=>(attrs['w:val']?'^h'+attrs['w:val']:'')+' ',
    'w:bookmarkStart':attrs=>'^bm{id:"'+attrs['w:name']+'"}'
},
closehandlers:{
    'w:hyperlink':()=>']'
}
}
export default ctx;