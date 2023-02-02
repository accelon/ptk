/* 
找到最可能的原文出處，加上 ^j 標記
找不到則加到 ^j@notfound
輸出檔名後綴 .out
*/
import {writeChanged, bsearchNumber,similarSentence,
    similarSet,unique,
    openPtk, readTextLines, parseAddress, parseAction, rangeOfAddress, alphabetically} from '../nodebundle.cjs'

const tidyLine=str=>{
    str=str.replace(/（[^）]+?）/g,'')
    .replace(/<[^）]+?>/g,'')
    .replace(/[^\u3400-\u9fff]/g,'')
    return str;
}
export const markj=async ()=>{
    console.time('markj')
    const address=process.argv[3];
    const txtfile=process.argv[4];
    const pat=process.argv[5];
    const pattern=pat?new RegExp(pat||''):null;

    const addr=parseAddress(address);
    const ptk=await openPtk(addr.ptkname);
    if (!ptk) {
        console.log('cannot open ptk',addr.ptkname);
        return;
    }
    
    const eleidarr=parseAction(addr.action);
    
    let [bktagname,bkid]=eleidarr[0];
    let [ttagname]=eleidarr[1]||'';

    if (!bkid) {
        bkid=bktagname;
        bktagname='bk';
    }
    const bktag=ptk.defines.bk;    
    const range=ptk.rangeOfAddress(bktagname+'#'+bkid);
    const ttag=ptk.defines[ttagname];

    const from=bsearchNumber(ttag.linepos, range[0]);
    const to=bsearchNumber(ttag.linepos, range[1]);
    await ptk.loadLines([range]);
    // console.log(bkid,ttagname,range,from,to)

    const candidates=[];
    for (let i=from;i<=to;i++){
        const line=tidyLine(ptk.getLine( ttag.linepos[i]));
        candidates.push(line.split((/(.)/)).filter(it=>!!it));
    }
    const lines=readTextLines(txtfile);
    let foundcount=0,unfoundcount=0;
    let sim;

    for (let i=0;i<lines.length;i++) {
        
        if (pattern && !lines[i].match(pattern))continue;
        const linearr=tidyLine(lines[i]).split(/(.)/).filter(it=>!!it);
        if (!pattern && linearr.length<6) continue;
        const matches=[];
        for (let j=0;j<candidates.length;j++) {
            const min=candidates[j].length>linearr.length?linearr.length:candidates[j].length;
            const a1=unique(candidates[j].slice(0,min).sort(alphabetically));
            const a2=unique(linearr.slice(0,min).sort(alphabetically));
            //sim=similarSentence(s1,s2); //20sec
            sim=similarSet(a2,a1) // 快10倍
            if (sim>0.5) {
                if (lines[i].indexOf('^j')==-1) {
                    matches.push([sim, from+j]);
                }
            }
        }
        if (matches.length){
            matches.sort((a,b)=>b[0]-a[0]);
            const sim=matches[0][0];
            if (sim>0.8) {
                const found=matches[0][1];
                const ttagid= ttag.fields.id.values[found];

                // if (sim>0.93 && sim<=0.94) {
                //     const j=found-from;
                //     const min=candidates[j].length>linearr.length?linearr.length:candidates[j].length;
                //     const a1=unique(candidates[j].slice(0,min).sort(alphabetically));
                //     const a2=unique(linearr.slice(0,min).sort(alphabetically));
        
                //     // console.log('\n',lines[i], ttagid)
                //     // console.log(ptk.getLine(ttag.linepos[found]));
                //     // console.log(a1,a2, similarSet(a1,a2))
                // }
                lines[i]+='^j@'+bkid+'.'+ttagname+(parseInt(ttagid)?'':'#')+ttagid+((sim<0.9)?'<sim='+sim.toFixed(2)+'>':'');
                foundcount++;   
            }
        } else if (pattern) {
            lines[i]+='^j@notfound'
            unfoundcount++;
        }

        process.stdout.write('\r'+ ( (i+1)*100/lines.length).toFixed(2)+'  '+'found '+foundcount+',unfound '+unfoundcount);
        // console.log(line)

    }
    writeChanged(txtfile+'.out',lines.join('\n'),true)
    console.timeEnd('markj')
}