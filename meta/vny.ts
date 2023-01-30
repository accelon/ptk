import {addTemplate} from '../compiler/template.ts'
const getParallels=(ptk,line)=>{
    const ck=ptk.nearestChunk(line+1);
    const bktag=ptk.defines.bk;
    const pc=ptk.columns.pc;
    const pcid=parseInt(ck.id.slice(2));
    const out=[];
    const bkidarr=bktag.fields.id.values;
    const at=  pc[ck.bkid].indexOf(pcid) ;
    for (let i=0;i<pc.fieldnames.length;i++) {
        const bkid=pc.fieldnames[i];
        const bkat=bkidarr.indexOf(bkid);
        const caption=bktag.innertext.get(bkat);
        if (~bkidarr.indexOf(bkid) && ck.bkid!==bkid) {
            out.push({ caption, bkid, ckid:'pc'+pc.fieldvalues[i][at] })
        }
    }
    return out
}
addTemplate('vny',{
    getParallels
});
