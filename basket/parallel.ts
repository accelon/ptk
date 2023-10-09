import {bsearchNumber} from '../utils/bsearch.ts';
import {poolGet,poolParallelPitakas} from '../basket/pool.ts'

const bookPrefix=bookname=>{
    let prefix=bookname;
    const at=bookname.lastIndexOf('_');
    if (~at) prefix=bookname.slice(0,at);
    return prefix;
}

export function getParallelLine(sourceptk,line,remote=false){
    const chunk=sourceptk.nearestChunk(line+1);
    if (!chunk) return [];
    const bk=this.defines.bk;
    const books=this.getParallelBook(chunk.bkid,remote);
    const bookats=books.map(id=> bk.fields.id.values.indexOf(id) );

    //同名 被 getParallelBook 去除，加回去
    // if (!~books.indexOf(chunk.bkat)) bookats.push(chunk.bkat);
    
    const bookstart=sourceptk.defines.bk.linepos[chunk.bkat];
    const sourcelineoff=line-bookstart;

    const out=[];
    
    for (let i=0;i<bookats.length;i++) {
        const bkid=bk.fields.id.values[ bookats[i]];
        const [start,end]=this.rangeOfAddress('bk#'+bkid+'.ck#'+chunk.id);
        const bookstart=bk.linepos[bookats[i]];
        const theline=bookstart+sourcelineoff;
        if (theline<=end) {
            out.push([this, start-bookstart, theline]);
        }    
    }
    return out;
}

export function getParallelBook(bookname:string|Number,remote:false){
    if (typeof bookname=='number') {
        bookname=this.defines.bk.fields.id.values[bookname];
    }
    if (!bookname) return [];
    const prefix=bookPrefix(bookname);
    //如果不是remote，那不能同名
    const books=this.defines.bk.fields.id.values.filter(it=>bookPrefix(it)==prefix && (remote || bookname!==it));
    return books;
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
        const linkarr=this.foreignlinks[sptkname];
        for (let i=0;i<linkarr.length;i++) {
            const [srctag,bk,targettagname,idStrArr,idxarr]=linkarr[i];
            if (targettagname!==tagname) continue;
            const srclinepos=sptk.defines[srctag].linepos;
            const at2=idStrArr.find( val);
            const tagvalues=this.defines[srctag].fields['@'].values;
            const arr=idxarr[at2];
            for (let j=0;j<arr?.length;j++){
                const address=tagvalues[arr[j]];
                const line=srclinepos[arr[j]];
                const ck=sptk.nearestChunk(line+1);
                out.push({text:address, line, ck, basket:sptkname});
                // console.log(at,address);
            }
        }
    }
    return out;
}


export function enumParallelsPtk(address:string){ //list ptk having same bk and ck
    const ptk=this;
    const range=ptk.rangeOfAddress(address);
    const ck=ptk.nearestChunk(range[0]+1);
    const paralleladdress='bk#'+ck.bkid+'.ck#'+ck.id;
    const ptks=poolParallelPitakas(ptk);
    const out=[ptk.header.name];
    for (let i=0;i<ptks.length;i++) {
        const ptk2=poolGet(ptks[i]);
        const [start,end]=ptk2.rangeOfAddress(paralleladdress);
        if (end>0) {
            out.push( ptks[i])
        }
    }
    return out;
}