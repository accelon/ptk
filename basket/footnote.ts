export function footNoteAddress(id:string,line:number){
    const ptk=this;
    const ck=ptk.getNearestChunk(line);
    const footnotetag=ptk.attributes.footnote||'fn';
    const chunktag=ptk.defines[ptk.attributes.chunktag];
    const bktag=ptk.defines[ptk.attributes.booktag||'bk'];
    const footbk=ck.bkid+'-fn';
    const at=bktag.fields.id.values.indexOf(footbk);
    const booknotebkline=bktag.linepos[at];
    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunk=chunktag.fields.id.values[closestchunk];    
    return ptk.name+':'+footbk+ '.'+ptk.attributes.chunktag+chunk+'.'+footnotetag+id;
}