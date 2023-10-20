import { alphabetically0, fromObj, readTextContent, tokenizeOfftext,TokenType, writeChanged } from "../nodebundle.cjs"


const sent=(rawcontent,ctx)=>{
    const lines=rawcontent.split(/\r?\n/);
    const sentences=[];
    for(let j=0;j<lines.length;j++) {
        const tokens=tokenizeOfftext(lines[j]);
        
        for (let i=0;i<tokens.length;i++) {
            const tk=tokens[i];
            if (tk.type>TokenType.SEARCHABLE) { 
                const prevtk=sentences[sentences.length-1];
                if (i&& sentences.length &&tk.type&TokenType.CJK && 
                    prevtk.type&TokenType.CJK) {
                    prevtk.text+=tk.text;
                } else {
                    tk.line=j;
                    sentences.push(tk);
                }
            } else {
                sentences.push(tk);
            }
        }
            
    }
    
    for (let i=0;i<sentences.length;i++) {
        const snt=sentences[i];
        if (!(snt.type&TokenType.CJK)) continue;
        if (!ctx.sents[snt.text]) {
            ctx.sents[snt.text]=[]
        }
        const arr=ctx.sents[snt.text];
        ctx.sents[snt.text].push(ctx.fn+':'+snt.line);
    }
}
const packLineoff=arr=>{
    let prevfn='',out=[];
    for (let i=0;i<arr.length;i++) {
        let [fn,line]=arr[i].split(':');
        if (fn!==prevfn) {
            out.push(fn)
        }
        out.push(parseInt(line))
        prevfn=fn;
    }
    return out;
}
const makeTSV=(arr)=>{
    const out=[];
    for (let i=0;i<arr.length;i++) {
        const [text,lineoff]=arr[i];
        out.push(text+'\t'+ packLineoff(lineoff).join(','));
    }
    out.unshift('^:<name=sent preload=true>	occur=filelinepos')
    return out.join('\n');
}
export const sentbuilder=(files,opts)=>{
    const ctx={sents:{}};
    const outfn=opts.indir+'sent.tsv';
    if (fs.existsSync(outfn)) {
        fs.unlinkSync(outfn);
    }
    files.forEach(fn=>{
        if (!fs.existsSync(opts.indir+fn)) return;
        const content =readTextContent(opts.indir+fn);
        ctx.fn=fn;
        sent(content,ctx);
    })
    const arr=fromObj(ctx.sents,(a,b)=>[a,b]).filter(it=>{
        return ((it[0].length>3&&it[1].length>2) || (it[0].length>1&&it[1].length>3)) && isNaN(parseInt(it[0]))
    });
    arr.sort(alphabetically0);

    const totaltextlength=arr.reduce(  (acc,v)=>acc+v[0].length , 0);
    const totalfreq=arr.reduce(  (acc,v)=>acc+v[1].length , 0);
    //console.log(arr.filter(it=>~it[0].indexOf('離隨煩惱')))
    // console.log(arr.slice(0,15).map(it=>[it[0],it[1].slice(0,3)]))
    console.log("sentence count",arr.length, "sentence length",totaltextlength,"sentence freq",totalfreq)
    writeChanged(outfn,makeTSV(arr),true)
}