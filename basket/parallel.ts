import {bsearchNumber} from '../utils/bsearch.ts';
import {poolGet} from '../basket/pool.ts'
export function getParallelLines(ptkname){
    console.log('address',ptkname)
}
//see compiler/linkfield.ts  for structure
export function foreignLinksAtTag(tagname, line){
    const tag=this.defines[tagname];
    const linepos=tag?.linepos;
    if (!tag || !linepos) return [];
    const at=bsearchNumber(linepos,line);
    const val=tag.fields.id.values[at].toString(); //
    const out=[];
    for (let sptkname in this.foreignlinks) {
        const sptk=poolGet(sptkname);
        const linkarr=this.foreignlinks[this.name];
        for (let i=0;i<linkarr.length;i++) {
            const [srctag,bk,targettagname,idStrArr,idxarr]=linkarr[i];
            if (targettagname!==tagname) continue;
            const srclinepos=sptk.defines[srctag].linepos;
            const at2=idStrArr.find( val);
            const tagvalues=this.defines[srctag].fields['@'].values;
            const arr=idxarr[at2];
            for (let j=0;j<arr.length;j++){
                const address=tagvalues[arr[j]];
                const line=srclinepos[arr[j]];
                const ck=sptk.nearestChunk(line);
                out.push({text:address, line, ck});
                // console.log(at,address);
            }
        }
    }
    return out;
}