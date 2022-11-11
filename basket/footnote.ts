export async function footNote(tagname,id,line){
    //convert line number to chunk, assuming chunk reset foonote 
    const ptk=this;
    const ck=ptk.getNearestChunk(line);
    const chunktag=this.defines[this.attributes.chunktag];
    const bktag=this.defines[this.attributes.booktag||'bk'];
    const footbk=ck.bkid+'-fn';
    const footnotetag=this.defines[this.attributes.footnote||'fn'];
    const at=bktag.fields.id.values.indexOf(footbk);
    const booknotebkline=bktag.linepos[at];

    const closestchunk=this.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunklinepos=chunktag.linepos[closestchunk];
    const closestfootnote=this.findClosestTag(footnotetag, 'id',parseInt(id), chunklinepos );
    
    // const footnotebkstart=bktag.linepos[]
    const footnoteline=footnotetag.linepos[closestfootnote];
    let nextfootnoteline=footnotetag.linepos[closestfootnote+1];
    if (!nextfootnoteline) nextfootnoteline=footnoteline;
    
    await ptk.loadLines([[footnoteline,nextfootnoteline]]);
    const lines=ptk.slice(footnoteline,nextfootnoteline);
    
    return lines;
}