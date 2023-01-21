import {writeChanged, peelXML, fromObj,filesFromPattern,readTextContent, alphabetically0} from '../nodebundle.cjs'
import path from 'path'
export const xmltag=()=>{
    console.time('xmltag');
    const outdir=process.argv[4];
    const files=filesFromPattern(process.argv[3])

    // console.log('working',workingdir)
    const ctx={ele:{},nested:[],fn:''}
    for (let i=0;i<files.length;i++) {
        const fn=files[i];
        ctx.fn=fn;
        process.stdout.write('\r'+fn+'   ');
        const content=readTextContent(fn);
       
        const [txt,tags]=peelXML(content,ctx);
        let outfn='';
        if (outdir) {
            outfn= outdir+path.sep +path.basename(fn)
            writeChanged(outfn+'.txt', txt,true);
            writeChanged(outfn+'.tsv', tags.map(it=>it.join('\t')).join('\n'),true);   
        }
    }
    
    const elements=fromObj(ctx.ele,true).sort((a,b)=>b[1].count-a[1].count);
    if (files.length>1) {
        const elementcount=elements.map( ([key,obj])=>key+'\t'+obj.count);
        const elementchild=elements.map( ([key,obj])=> 
        obj.child?(key+'\t'+Object.keys(obj.child).join(',')):null ).filter(it=>!!it).sort(alphabetically0);
        writeChanged('elements-nested.json',ctx.nested.join('\n'),true)
        writeChanged('elements-count.json',elementcount.join('\n'),true);
        writeChanged('elements-child.json',elementchild.join('\n'),true);
    } else {
        console.dir(elements,{depth:10});
    }
    console.timeEnd('xmltag');
}

export const tei=()=>{
    const fn=process.argv[3];
    const workingdir=process.argv[4];
    const pintag=process.argv[5]||'p';
    const checktag=[];
    const content=readTextContent(fn);
    content=nullify(content)
    const [txt,tags,stat]=parseTEI(content,pintag);
    let outfn=fn;
    if (workingdir) {
        outfn= workingdir+path.sep +path.basename(fn)
    }
    writeChanged(outfn+'.txt', txt,true);
    writeChanged(outfn+'.tsv', tags.map(it=>it.join('\t')).join('\n'),true);
    console.table(stat);
    console.log(nested)
}

