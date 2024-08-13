import {addTemplate} from '../compiler/template.ts'
//類似條文
const getCorrespondece=(ptk,line)=>{
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
        const caption=bktag.getInnertext(bkat);
        if (~bkidarr.indexOf(bkid) && ck.bkid!==bkid) {
            out.push({ caption, bkid, ckid:'pc'+pc.fieldvalues[i][at] })
        }
    }
    return out
}
export const meta_vny={getCorrespondece};
addTemplate('vny',meta_vny);
