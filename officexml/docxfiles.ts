import {processDocument,processRels} from './docx.ts'
import {sep} from 'path';
const docx2offtext=async (ctx,fn)=>{
    const ifn=ctx.cwd+sep+fn
    if (!fs.existsSync(ifn)) {
        console.log('file not found',ifn)
        return;
    }
    const buffer = fs.readFileSync(ifn);
    ctx.fn=fn;
    const zip=await ctx.readZipBuffer(buffer);
    const filename=fn.replace('.docx','')
    ctx.onDocStart&&ctx.onDocStart(ctx,filename)
    ctx.rels=processRels(await zip.file('word/_rels/document.xml.rels').async('string'),ctx);
    const out=processDocument(await zip.file('word/document.xml').async('string'),ctx);
    if (!ctx.output) ctx.output={};
    ctx.output[filename]=out;
}
export const processDocuments=async (ctx)=>{ //JSZip.loadAsync
    const t=new Date();
    for await (let item of ctx.lst) {
        if (!item) break;
        if (ctx.verbose) process.stdout.write('\r '+item +'                        ') 
        if (item.startsWith('cd ')) {
            ctx.cwd=item.slice(3);
        } else {
            await docx2offtext(ctx,item);
        }
    }    
    ctx.postProcess&& ctx.postProcess(ctx);
    console.log('time elapsed',new Date()-t)
}