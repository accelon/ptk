import {poolParallelPitakas} from '../basket/pool.ts';
import {usePtk} from '../basket/index.ts';

export const parallelWithDiff=(ptk,line,includeself=false)=>{
    const out=[];
    if (!ptk) return out;
    const parallelPitakas=poolParallelPitakas(ptk);

    for (let i=0;i<parallelPitakas.length;i++) {
        const pptk=usePtk(parallelPitakas[i]);
        const lines=pptk.getParallelLine( ptk, line );			
        lines.forEach( it=>out.push([...it]))
    }

    //因為nearesttag 返回 0 表示 出現在第一個bk 之前
    const bk=ptk.nearestTag(line,'bk')-1;
    const bookstart=ptk.defines.bk.linepos[bk];
    if (includeself) {
        out.push([ptk, bookstart, line]);
    }
    const lineoff=line-bookstart;
    
    const books=ptk.getParallelBook(bk);
    for (let i=0;i<books.length;i++) {
        const [start,end]=ptk.rangeOfAddress('bk#'+books[i]);
        if (lineoff <= end-start) {
            //假設每一行都對齊，所以返回 書的行差
            out.push([ptk, start-bookstart, start+lineoff ]);
        }
    }
    return out;
}
//
export const getParallelLines=async (ptk,line,_out)=>{
    const lines=parallelWithDiff(ptk,line,true);
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