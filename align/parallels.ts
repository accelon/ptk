import {poolParallelPitakas} from '../basket/pool.ts';
import {usePtk} from '../basket/index.ts';

export const parallelWithDiff=(ptk,line,includeself=false,local=true,remote=false)=>{
    const out=[];
    if (!ptk) return out;
    //因為nearesttag 返回 0 表示 出現在第一個bk 之前
    const bkat=ptk.nearestTag(line+1,'bk')-1;
    const bookstart=ptk.defines.bk.linepos[bkat];
    if (includeself) {
        out.push([ptk, bookstart, line]);
    }
    const lineoff=line-bookstart;
    const bkid=ptk.defines.bk.fields.id.values[bkat];
    const books=ptk.getParallelBook(bkid);
    const [bkstart,bkend]=ptk.rangeOfAddress('bk#'+bkid);

    if (local) {
        for (let i=0;i<books.length;i++) {
            const [start,end]=ptk.rangeOfAddress('bk#'+books[i]);
            if (lineoff <= end-start) {
                //假設每一行都對齊，所以返回 書的行差
                out.push([ptk, start-bookstart, start+lineoff ]);
            }
        }    
    }
    if (remote) {
        const parallelPitakas=poolParallelPitakas(ptk);
        for (let i=0;i<parallelPitakas.length;i++) {
            const pptk=usePtk(parallelPitakas[i]);
            // const lineoff=line-bkstart;
            // const [start]=pptk.rangeOfAddress('bk#'+bkid);
            const lines=pptk.getParallelLine( ptk, line ,true);
            lines.forEach( it=>out.push([...it]))
        }    
    }
    return out;
}

export const getParallelLines=async (ptk,line,_out,opts={})=>{
    const lines=parallelWithDiff(ptk,line,true,opts.local,opts.remote);
    const out=[];
    for (let i=0;i<lines.length;i++) {
        const [ptk,bookstart,line]=lines[i];
        await ptk.loadLines([line]);
        const linetext=ptk.getLine(line);
        const heading=ptk.getHeading(line);
        out.push( {ptk,heading,linetext,line} );
    }
    if (_out) _out.push(...out);
    return out;
}