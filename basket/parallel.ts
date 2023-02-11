import {bsearchNumber} from '../utils/bsearch.ts';
import {poolGet} from '../basket/pool.ts'

const bookPrefix=bookname=>{
    let prefix=bookname;
    const at=bookname.lastIndexOf('_');
    if (~at) prefix=bookname.slice(0,at);
    return prefix;
}

export function getParallelLine(sourceptk,line){
    const chunk=sourceptk.nearestChunk(line);
    const lineoff=line-chunk.line;

    const books=this.getParallelBook(chunk.bkid);
    //同名 被 getParallelBook 去除，加回去
    if (!~books.indexOf(chunk.bkid)) books.push(chunk.bkid);
    const out=[];
    for (let i=0;i<books.length;i++) {
        const [start,end]=this.rangeOfAddress('bk#'+books[i]+'.ck#'+chunk.id);
        if (lineoff<=end-start) {
            out.push(start + lineoff - line)
        }    
    }
    return out;
}

export function getParallelBook(bookname:string|Number){
    if (typeof bookname=='number') {
        bookname=this.defines.bk.fields.id.values[bookname];
    }
    const prefix=bookPrefix(bookname);
    return this.defines.bk.fields.id.values.filter(it=>bookPrefix(it)==prefix&&bookname!==it);
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
                const ck=sptk.nearestChunk(line+1);
                out.push({text:address, line, ck});
                // console.log(at,address);
            }
        }
    }
    return out;
}