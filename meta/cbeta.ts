import {onTextWithInserts,onOpen,onClose,DOMFromString,xpath,walkDOMOfftext} from '../xml/index.ts';
import {nullify_cbeta} from './nullify_cbeta.ts';
import {parseRefTarget} from './cbeta-textlinks.ts';
import {createChunkId_cbeta,insertTag_cbeta,offGen_cbeta,
    StockCharMap_cbeta,buildCharMap_cbeta} from './offtag_cbeta.ts';
import { addTemplate } from '../compiler/template.js';
const fixJuanT=(bkno,juan,sutraline)=>{
    let bk='';
    if (juan===1) {
        bk='^bk'+bkno+'['+sutraline;
    }
    if (bkno==='946') {
        if (juan>=4) juan--; //946 其實只有四卷, 缺檔 _003
    } else if (bkno==="2799" ||bkno==='2825') {
        if (juan===3) juan=2;
    } else if (bkno==='2805') {
        if (juan===5) {
            bk='^bk#'+bkno+'['+sutraline;
            juan=1;
        } else if (juan===7) juan=2; 
    } else if (bkno==='2139') {
        if (juan===10) juan=2; //workaround 老子西昇化胡經
    } else if (bkno==='2772') {
        if (juan===3) {
            bk='^bk#'+bkno+'['+sutraline;
            juan=1;
        } else if (juan===6) juan=2; 
    } else if (bkno==='2748'||bkno==='2754'||bkno==='2757'
    ||bkno==='2764b'||bkno==='2769'||bkno==='2803'||bkno=='2809'
    ||bkno==='2820') { //only 1 juan
        bk='^bk<id='+bkno+'['+sutraline;
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

    let m=fn.match(/n([\dabcdefABCDEF]+)_(\d+)\.xml/);
    let bk='',bkno='',chunk='';
    
    const sutraNo=m[1].replace('_'+m[2],'').toLowerCase();
    let sutraline=ctx.catalog&&ctx.catalog[sutraNo]&&ctx.catalog[sutraNo].trim() ||'';
    bkno=sutraNo.replace(/^0+/,'');

    const at=sutraline.indexOf('^');
    if (at>-1) {
        sutraline=sutraline.substr(0,at)+']'+sutraline.substr(at);
    } else sutraline+=']'

    let juan=parseInt(m[2]);
    

    if (fn[0]=='T') {
        [bk,juan]=fixJuanT(bkno,juan,sutraline);
    } else if (juan===1) {
        bk='^bk'+bkno+'['+sutraline; //empty sutraline
    }

    chunk='^ck'+juan+'【卷'+juan+'】';

    if (!ctx.teictx) { //cross multiple file
        ctx.teictx={defs:ctx.labeldefs||{},lbcount:0,hide:0,snippet:'',
        div:0,charmap,fn,started:false,transclusion:ctx.transclusion||{},milestones:ctx.milestones||{}};    
    }
    let content=bk+chunk+walkDOMOfftext(body,ctx.teictx,onOpen,onClose,onTextWithInserts);
    ctx.teictx.out='';
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
export const fromCBETA = cbeta =>{

}
export const toCBETA = address=>{
    
}
const MaxPage={
    1:924,
    2:884,
    3:975,
    4:802,
    5:1074,
    6:1073,
    7:1110,
    8:917,
    9:788,
    10:1047,
    11:977,
    12:1119,
    13:998,
    14:968,
    15:807,
    16:857,
    17:963,
    18:946,
    19:744,
    20:940,
    21:968,
    22:1072,
    23:1057,
    24:1122,
    25:914,
    26:1031,
    27:1004,
    28:1001,
    29:977,
    30:1035,
    31:896,
    32:790,
    33:963,
    34:1008,
    35:963,
    36:1066,
    37:903,
    38:1114,
    39:1040,
    40:857,
    41:982,
    42:868,
    43:1009,
    44:875,
    45:978,
    46:1013,
    47:1064,
    48:1160,
    49:1019,
    50:1023,
    51:1140,
    52:860,
    53:1030,
    54:1290,
    55:1178,
    //todo 56~84
    85:1464,
}
export const meta_cbeta={translatePointer, parseFile,parseBuffer,onOpen,onClose,
    createChunkId:createChunkId_cbeta,
    insertTag:insertTag_cbeta,
    offGen:offGen_cbeta,
    buildCharMap:buildCharMap_cbeta,
    StockCharMap:StockCharMap_cbeta,
    parseRefTarget,
    MaxPage,
    fromCBETA, toCBETA,
    nullify:nullify_cbeta};

addTemplate('cbeta',{MaxPage, guidedrawer:'cbeta'} );