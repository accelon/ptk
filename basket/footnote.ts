import {bsearchNumber} from "../utils/index.ts"
export function footNoteAddress(id:string,line:number){
    const ptk=this;
    const ck=ptk.getNearestChunk(line);

    const chunktag=ptk.defines.ck;
    const bktag=ptk.defines.bk;
    const footbk=ck.bkid+'-fn';
    const at=bktag.fields.id.values.indexOf(footbk);
    const booknotebkline=bktag.linepos[at];
    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunk=chunktag.fields.id.values[closestchunk];    
    const address=ptk.name+':'+footbk+ '.'+ptk.attributes.chunktag+chunk+'.fn'+id;
    return address;
}

export function footNoteByAddress(id:string,line:number){
    const ptk=this;
    const ck=ptk.getNearestChunk(line);
    const chunktag=ptk.defines.ck;
    const bktag=ptk.defines.ck;   
    const footnotetag=ptk.defines.f;
    let footbk=ck.bkid.replace('-fn','');
    const at=bktag.fields.id.values.indexOf(footbk);
    if (at==0) footbk=''; else footbk+='.';  //not needed to specified chunk    
    
    const booknotebkline=bktag.linepos[at];
    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunk=chunktag.fields.id.values[closestchunk];    
    const footnoteat=ptk.findClosestTag( footnotetag, 'id', parseInt(id),chunktag.linepos[closestchunk] ); 
    const footnoteline=footnotetag.linepos[footnoteat];

    const highlightline=footnoteline-chunktag.linepos[closestchunk];
    const address=footbk+ ptk.attributes.chunktag+chunk+ (highlightline?":"+highlightline:'');
    return address;
}