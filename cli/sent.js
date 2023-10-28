import { similarSet,alphabetically0, fromObj, readTextContent, sentencize, TokenType, writeChanged,bsearchNumber } from "../nodebundle.cjs"
const sent=(rawcontent,ctx)=>{
    const lines=rawcontent.split(/\r?\n/);
    let sentences=[];
    for(let j=0;j<lines.length;j++) {
        sentences.push(...sentencize(lines[j],j));
    }
    for (let i=0;i<sentences.length;i++) {
        const snt=sentences[i];
        if (!(snt.type&TokenType.CJK)) continue;
        if (!ctx.sents[snt.text]) {
            ctx.sents[snt.text]=[]
        }
        ctx.sents[snt.text].push(ctx.linestart+snt.line);
    }
    return lines.length;
}
const packLineoff=(arr,ctx)=>{
    let prevfn='',out=[];
    for (let i=0;i<arr.length;i++) {
        const at=bsearchNumber(ctx.filestarts, arr[i])-1;
        const fn=ctx.files[at];
        const line=arr[i]-ctx.filestarts[at];
        if (fn!==prevfn) {
            out.push(fn)
        }
        out.push(line)
        prevfn=fn;
    }
    return out;
}
const makeTSV=(arr,ctx)=>{
    const out=[];
    for (let i=0;i<arr.length;i++) {
        const [text,lineoff,sim100,sim90,sim80]=arr[i];
        sim100&&sim100.sort((a,b)=>a-b)
        sim90&&sim90.sort((a,b)=>a-b)
        sim80&&sim80.sort((a,b)=>a-b)
        out.push(text+'\t'+ packLineoff(lineoff,ctx).join(',')+'\t'+
        (sim100||[]).join(',')+'\t'+(sim90||[]).join(',')+'\t'+(sim80||[]).join(','));
    }
    out.unshift('^:<name=sent preload=true>\toccur=filelinepos\tsim100=numbers\tsim90=numbers\tsim80=numbers')
    return out.join('\n');
}
const statSimilarity=arr=>{
    let prevpercent=0,sim100=0,sim90=0,sim80=0;
    for (let i=0;i<arr.length;i++) {
        const percent=Math.floor((i/arr.length)*100);
        if (percent>prevpercent) {
            process.stdout.write('\r'+percent+'%  fullcount:'+sim100+',>90:'+sim90+', >80:'+sim80);
            prevpercent=percent;
        }
        for (let j=i+1;j<arr.length;j++) {
            const sim=similarSet(arr[j][1], arr[i][1]);
            if (sim==1) {
                if (!arr[j][2])arr[j][2]=[];
                arr[j][2].push(i);
                if (!arr[i][2])arr[i][2]=[];
                arr[i][2].push(j);

                sim100++;
            } else if (sim>=0.9) {
                if (!arr[j][3])arr[j][3]=[];
                arr[j][3].push(i);
                if (!arr[i][3])arr[i][3]=[];
                arr[i][3].push(j);
                sim90++;
            } else if (sim>=0.8) {
                if (!arr[j][4])arr[j][4]=[];
                arr[j][4].push(i);
                if (!arr[i][4])arr[i][4]=[];
                arr[i][4].push(j);

                sim80++;
                //console.log(sim,arr[i][0],arr[i][1].length,arr[j][0],arr[j][1].length);
            }
        }
    }

}
export const sentbuilder=(files,opts)=>{
    const ctx={sents:{},filestarts:[],linestart:0,files};
    const outfn=opts.indir+'sent.tsv';
    if (fs.existsSync(outfn)) {
        fs.unlinkSync(outfn);
    }
    files.forEach(fn=>{
        if (!fs.existsSync(opts.indir+fn)) return;
        ctx.filestarts.push(ctx.linestart);
        
        const content =readTextContent(opts.indir+fn);
        ctx.fn=fn;
        ctx.linestart+=sent(content,ctx);
    })
    const arr=fromObj(ctx.sents,(a,b)=>[a,b]).filter(it=>{
        return ((it[0].length>3&&it[1].length>2) || (it[0].length>1&&it[1].length>3)) && isNaN(parseInt(it[0]))
    });
    arr.sort(alphabetically0);
    statSimilarity(arr);
    const totaltextlength=arr.reduce(  (acc,v)=>acc+v[0].length , 0);
    const totalfreq=arr.reduce(  (acc,v)=>acc+v[1].length , 0);
    //console.log(arr.filter(it=>~it[0].indexOf('離隨煩惱')))
    // console.log(arr.slice(0,15).map(it=>[it[0],it[1].slice(0,3)]))
    console.log("sentence count",arr.length, "sentence length",totaltextlength,"sentence freq",totalfreq)
    writeChanged(outfn,makeTSV(arr,ctx),true)
}