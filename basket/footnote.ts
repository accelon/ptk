import {getBookColumnText} from './entries.ts'

export function findFootmarkInBook(ptk,id:string,line) {
    const ck=ptk.nearestChunk(line);
    const fntag=ptk.defines.fn;

    const closestfn=ptk.findClosestTag( fntag, 'id', id, line);
    if (~closestfn) {
        return ptk.name+':bk#'+ck.bk.id+'.fm'+id;
    }
}
export function footNoteAddress(id:string,line:number){
    const ptk=this;

    //先找同頁注
    const fnaddr=findFootmarkInBook(ptk,id,line);
    if (fnaddr) return fnaddr;

    //異頁注
    const ck=ptk.nearestChunk(line);
    const chunktag=ptk.defines.ck;
    const bktag=ptk.defines.bk;
    const footbk='fn_'+ck.bkid;
    
    const at=bktag.fields.id.values.indexOf(footbk);
    if (at==-1) return ptk.name+':'+ck.bk.id+'.fm'+id;

    const booknotebkline=bktag.linepos[at];
    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunk=chunktag.fields.id.values[closestchunk];    
    const address=ptk.name+':'+footbk+ '.'+
    'ck'+(parseInt(chunk)?chunk:'#'+chunk)
    +'.fn'+id;
    return address;
}
export function footNoteInTSV(id:string,line:number){//assuming footnote=bk
    const ptk=this;
    let ck='',hasck=false;
    if (!id) return '';
    if (id && ~id.indexOf('.')) {//given a chunk
        ck=ptk.getChunk(id.slice(0,id.indexOf('.')));
        hasck=true;   
    } else {
        ck=ptk.nearestChunk(line);
    }
    if (!ck) return '';
    let bkid=ck.bkid+"-note";//優先
    let footnotecol=ptk.columns[bkid]
    if (!footnotecol) {
        bkid=ck.bkid;
        footnotecol=ptk.columns[bkid];//each tsv has one book
    }
    if (!footnotecol) return '--no note--';

    if (footnotecol.attrs.footnote=='ck' && !hasck) {
        id=ck.id+'.'+id;
    }
    let o=footnotecol.fieldByKey(id,"note")||'';
    if (!o) { //try dkat
        const key=ck.id+'.'+id;
        const r=getBookColumnText(ptk,bkid,key)
        o=r[1]; 
    }
    return o;
}
export function footNoteByAddress(id:string,line:number){
    const ptk=this;
    const ck=ptk.nearestChunk(line);
    const chunktag=ptk.defines.ck;
    const bktag=ptk.defines.ck;   
    const footnotetag=ptk.defines.f;
    let footbk=ck.bkid.replace('_fn','');
    const at=bktag.fields.id.values.indexOf(footbk);
    if (at==0) footbk=''; else footbk+='.';  //not needed to specified chunk    
    
    const booknotebkline=bktag.linepos[at];
    const closestchunk=ptk.findClosestTag( chunktag, 'id',ck.id, booknotebkline);
    const chunk=chunktag.fields.id.values[closestchunk];    
    const footnoteat=ptk.findClosestTag( footnotetag, 'id', parseInt(id),chunktag.linepos[closestchunk] ); 
    const footnoteline=footnotetag.linepos[footnoteat];

    const highlightline=footnoteline-chunktag.linepos[closestchunk];
    const address=footbk+ 'ck'+chunk+ (highlightline?":"+highlightline:'');
    return address;
}