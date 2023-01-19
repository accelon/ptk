import {onTextWithInserts,onOpen,onClose,DOMFromString,xpath,walkDOMOfftext} from '../xml/index.ts';
import { nullify_cbeta } from './nullify_cbeta.ts';
import {createChunkId_cbeta,insertTag_cbeta,offGen_cbeta,buildCharMap_cbeta} from './offtag_cbeta.ts';
const fixJuanT=(bkno,juan,sutraline)=>{
    let bk='';
    if (juan===1) {
        bk='^bk#'+bkno+' '+sutraline;
    }

    if (bkno==='946') {
        if (juan>=4) juan--; //946 其實只有四卷, 缺檔 _003
    } else if (bkno==="2799" ||bkno==='2825') {
        if (juan===3) juan=2;
    } else if (bkno==='2805') {
        if (juan===5) {
            bk='^bk#'+bkno+' '+sutraline;
            juan=1;
        } else if (juan===7) juan=2; 
    } else if (bkno==='2139') {
        if (juan===10) juan=2; //workaround 老子西昇化胡經
    } else if (bkno==='2772') {
        if (juan===3) {
            bk='^bk#'+bkno+' '+sutraline;
            juan=1;
        } else if (juan===6) juan=2; 
    } else if (bkno==='2748'||bkno==='2754'||bkno==='2757'
    ||bkno==='2764b'||bkno==='2769'||bkno==='2803'||bkno=='2809'
    ||bkno==='2820') { //only 1 juan
        bk='^bk[id='+bkno+' '+sutraline;
        juan=1;
    }
    return [bk,juan]
}

const parseBuffer=(buf:string,fn='',ctx)=>{
    // if (fn) process.stdout.write('\r processing'+fn+'    '+buf.length);
    ctx.rawContent=buf;
    const el=DOMFromString(buf);
    const body=xpath(el,'text/body');
    const charmap=buildCharMap_cbeta(el);

    let m=fn.match(/n([\dabcdefABCDEF]+)_(\d+)/);
    let bk='',bkno='',chunk='';
    
    const sutraNo=m[1].replace('_'+m[2],'').toLowerCase();
    let sutraline=ctx.catalog&&ctx.catalog[sutraNo]&&ctx.catalog[sutraNo].trim() ||'';
    bkno=sutraNo.replace(/^0+/,'');

    const at=sutraline.indexOf('^');
    if (at>-1) {
        sutraline=sutraline.substr(0,at)+')'+sutraline.substr(at);
    } else sutraline+=')'

    let juan=parseInt(m[2]);
    
    if (fn[0]=='T') {
        [bk,juan]=fixJuanT(bkno,juan,sutraline);
    } else if (juan===1) {
        bk='^bk'+bkno+(sutraline!==')'?'('+sutraline:''); //empty sutraline
    }

    chunk='^ck'+juan;
    if (!ctx.teictx) { //cross multiple file
        ctx.teictx={defs:ctx.labeldefs,lbcount:0,hide:0,snippet:'',
        div:0,charmap,fn,started:false,transclusion:ctx.transclusion,milestones:ctx.milestones};    
    }
    let content=bk+chunk+walkDOMOfftext(body,ctx.teictx,onOpen,onClose,onTextWithInserts);
    content=content.replace(/\^r\n/g,'\n');
    return content;
}
const parseFile=async (f,ctx)=>{
    let fn=f;
    if (typeof f.name==='string') fn=f.name;

    const ext=fn.match(/(\.\w+)$/)[1];
    if (ext=='.xml') {
        const xmlcontent=await fs.promises.readFile(f,'utf8');
        const parsed=parseBuffer(xmlcontent,fn,ctx);
        return parsed;
    } else {
        throw "unknown extension "+ext
    }
}

export const translatePointer=str=>{
    const m=str.match(/([A-Z])(\d\d)n(\d{4}[abcde]*)_p(\d\d\d\d)([abcdef])/);
    if (m) {
        const [mm,zj,vol,sutrano,page,col]=m;
        return '/cb-'+zj.toLowerCase()+'/v#'+vol.replace(/^0/,'')+'/p#'+page.replace(/^0+/,'')+col;
    }
    return ''
}

export const meta_cbeta={translatePointer, parseFile,parseBuffer,onOpen,onClose,
    createChunkId:createChunkId_cbeta,
    insertTag:insertTag_cbeta,
    offGen:offGen_cbeta,
    buildCharMap:buildCharMap_cbeta,
    nullify:nullify_cbeta};
