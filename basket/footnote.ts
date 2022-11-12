export async function footNote(tagname,id,line){
    //convert line number to chunk, assuming chunk reset foonote 
    const ptk=this;
    const ck=ptk.getNearestChunk(line);
    const chunktag=ptk.defines[ptk.attributes.chunktag];
    const bktag=ptk.defines[ptk.attributes.booktag||'bk'];
    const footbk=ck.bkid+'-fn';
    const footnotetag=ptk.defines[ptk.attributes.footnote||'fn'];
    const at=bktag.fields.id.values.indexOf(footbk);
    const booknotebkline=bktag.linepos[at];

    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunklinepos=chunktag.linepos[closestchunk];
    const closestfootnote=ptk.findClosestTag(footnotetag, 'id',parseInt(id), chunklinepos );
    
    // const footnotebkstart=bktag.linepos[]
    const footnoteline=footnotetag.linepos[closestfootnote];
    let nextfootnoteline=footnotetag.linepos[closestfootnote+1];
    if (!nextfootnoteline) nextfootnoteline=footnoteline;
    
    await ptk.loadLines([[footnoteline,nextfootnoteline]]);
    const lines=ptk.slice(footnoteline,nextfootnoteline);
    
    return lines;
}
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