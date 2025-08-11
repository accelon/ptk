import {onTextWithInserts,onOpen,onClose,DOMFromString,xpath,walkDOMOfftext} from '../xml/index.ts';
import {nullify_cbeta} from './nullify_cbeta.ts';
import {parseRefTarget,parseVolNoPage} from './cbeta-textlinks.ts';
import {createChunkId_cbeta,insertTag_cbeta,offGen_cbeta,
    StockCharMap_cbeta,buildCharMap_cbeta} from './offtag_cbeta.ts';
import { addTemplate } from '../compiler/template.ts';
import { breakChineseSentence } from '../utils/cjk.ts';
import { bsearchNumber } from '../utils/bsearch.ts';
import {TaishoJuanPagePacked} from './taishosutrajuan.ts'; //created by cb-t/gen-sutra-pagestart.js
import { unpackIntDelta } from '../utils/unpackintarray.ts';

const fixJuanT=(bkno,juan,sutraname)=>{
    let bk='';
    if (juan===1) {
        bk='^bk'+bkno+'【'+sutraname;
    }
    if (bkno==='946') {
        if (juan>=4) juan--; //946 其實只有四卷, 缺檔 _003
    } else if (bkno==="2799" ||bkno==='2825') {
        if (juan===3) juan=2;
    } else if (bkno==='2805') {
        if (juan===5) {
            bk='^bk#'+bkno+'【'+sutraname;
            juan=1;
        } else if (juan===7) juan=2; 
    } else if (bkno==='2139') {
        if (juan===10) juan=2; //workaround 老子西昇化胡經
    } else if (bkno==='2772') {
        if (juan===3) {
            bk='^bk#'+bkno+'【'+sutraname;
            juan=1;
        } else if (juan===6) juan=2; 
    } else if (bkno==='2748'||bkno==='2754'||bkno==='2757'
    ||bkno==='2764b'||bkno==='2769'||bkno==='2803'||bkno=='2809'
    ||bkno==='2820') { //only 1 juan
        bk='^bk<id='+bkno+'【'+sutraname;
        juan=1;
    }
    return [bk,juan]
}

const parseBuffer=(buf:string,fn='',ctx)=>{
    // if (fn) process.stdout.write('\r processing'+fn+'    '+buf.length);
    buf=buf.replace(/\r?\n<lb/g,'<lb').replace(/\r?\n<pb/g,'<pb');
    ctx.rawContent=buf;

    const el=DOMFromString(buf);
    const body=xpath(el,'text/body');
    const charmap=buildCharMap_cbeta(el);

    let m=fn.match(/n([\dabcdefABCDEF]+)_(\d+)\.xml/);
    let bk='',bkno='',chunk='';
    
    const sutraNo=m[1].replace('_'+m[2],'').toLowerCase();
    let sutraname=ctx.catalog&&ctx.catalog[sutraNo]&&ctx.catalog[sutraNo].trim() ||'';
    bkno=sutraNo.replace(/^0+/,'');
    
    const at=sutraname.indexOf('^');
    if (at>-1) {
        sutraname=sutraname.substr(0,at)+'】'+sutraname.substr(at);
    } else sutraname+='】'

    let juan=parseInt(m[2]);

    if (fn[0]=='T') {
        [bk,juan]=fixJuanT(bkno,juan,sutraname);
    } else if (juan===1) {
        bk='^bk'+bkno+'【'+sutraname; //empty sutraname
    }

    chunk='^juan'+juan;

    if (!ctx.teictx) { //cross multiple file
        ctx.teictx={defs:ctx.labeldefs||{},lbcount:0,hide:0,snippet:'', volumname:ctx.volumname||{},
        div:0,charmap,fn,started:false,transclusion:ctx.transclusion||{},milestones:ctx.milestones||{}};    
    }
    ctx.teictx.sutraNo=sutraNo;
    ctx.teictx.started=false;
    const openhandler=Object.assign({},onOpen,ctx.onOpen||{});
    const closehandler=Object.assign({},onClose,ctx.onClose||{});
    let content=bk+chunk+walkDOMOfftext(body,ctx.teictx,openhandler,closehandler,onTextWithInserts);
    ctx.teictx.out='';
    content=content.replace(/\^r\n/g,'\n').replace(/\n+/g,'\n');
    return content;
}
const tidy=content=>{
    return content.replace(/([、，；]?)<caesura[^>]*\/>/g,(m,m1)=>m1||'　');
}
const parseFile=async (f,ctx)=>{
    let fn=f;
    if (typeof f.name==='string') fn=f.name;
    const ext=fn.match(/(\.\w+)$/)[1];
    if (ext=='.xml') {
        const xmlcontent=tidy(await fs.promises.readFile(f,'utf8'));
        
        let nullified=nullify_cbeta( xmlcontent);
        if (ctx.postNullify) {
            nullified=ctx.postNullify(nullified)
        }
        
       //if (~fn.indexOf('T01n0001_004')) writeChanged(fn+'-nullify',nullified,true)
        const parsed=parseBuffer( nullified ,fn,ctx);
        const lines=parsed.split("\n")
        for (let i=0;i<lines.length;i++) {
            let line=lines[i];
            if (! (line.startsWith('^h')||line.startsWith('^bk'))) {
                lines[i]=breakChineseSentence(line);
            }
        }
        return lines.join('\n');
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

const TaishoMaxPage=[ 0, //每一冊之頁數
924,884,975,802,1074,1073,1110,917,788,//1
1047,977,1119,998,968,807,857,963,946,744,//10
940,968,1072,1057,1122,914,1031,1004,1001,977,//20
1035,896,790,963,1008,963,1066,903,1114,1040,//30
857,982,868,1009,875,978,1013,1064,1160,1019,//40
1023,1140,860,1030,1290,1178,828,782,22,802,//50
782,810,802,970,778,796,926,916,778,866,//60
840,912,768,726,822,960,888,878,918,824,//70
760,724,786,930,906,1464]//80~85 

export const TaishoVolSutra=[ //每一冊開頭的經號
1,99,152,192,220,220,220,221,262,279,
310,321,397,425,585,656,721,848,918,1030,
1199,1421,1435,1448,1505,1519,1545,1546,1558,1564,
1585,1628,1693,1718,1731,1736,1744,1765,1783,1804,
1821,1824,1829,1835,1852,1911,1957,2001,2026,2040,
2066,2102,2121,2123,2145,  2185,2201,2211,2216,2218,  // from sat
2221,2246,2249,2251,2255,2263,2266,2267,2272,2291,  
2309,2326,2341,2347,2385,2409,2411,2461,2501,2543,  
2562,2580,2608,2680,2732,     
2921//terminator
]

//經號以純數字表達，作為陣列的index , 後綴a,b勿略
//頁碼/3 ，餘數為欄
//大般若經220 6冊為 2921 號, 7冊為2922 號
const TaishoJuanPage=TaishoJuanPagePacked.split(/\n/).map( unpackIntDelta );

//給定經號和卷數，返回冊頁碼
export const TaishoPageFromJuan=( sutranumber, juan=1 )=>{
    if (typeof sutranumber!=="number") sutranumber=parseInt(sutranumber)||1;
    let vol=bsearchNumber(TaishoVolSutra, sutranumber+1 );
    if (sutranumber==220) {
        if (juan>400) {
            juan-=400;
            sutranumber=2922;
            vol=7;
        } else if (juan>200) {
            juan-=200;
            sutranumber=2921;
            vol=6;
        } else {
            vol=5;
        }
    }

    const jpage=TaishoJuanPage[sutranumber-1]
    if (!jpage) return [0,0,0];
    
    const pgcol=jpage[juan-1]||0 ; 
    return [vol,Math.floor(pgcol/3), pgcol%3 ];
}
//給定冊頁碼，返回經號和卷數
export const TaishoJuanFromPage=( volpage, page=1, col=0 )=>{
    let vol=volpage;
    // input format:   "35p77c" , or    35, '77c'
    if (typeof volpage=='string') {
        [vol,_page]=volpage.split('p');
        if (_page) page=_page;
    }
    if (typeof page=='string') {
        const m=page.match(/([bc])$/);
        if (m) col= m[1].charCodeAt(0)-0x61 ;
        page=parseInt(page);
    }
    vol=parseInt(vol);
    if (isNaN(vol)) return [0,0];
    const pn=page*3+col;
    let startsutra=TaishoVolSutra[vol-1];
    let endsutra=TaishoVolSutra[vol];
    if (vol==5) {
        startsutra=220;
        endsutra=221;
    } else if (vol==6) {
        startsutra=2921;  //TaishoJuanPage 第6冊的虛擬經號為2921
        endsutra=2922;
    } else if (vol==7) {
        startsutra=2922;
        endsutra=2923;
    }
    for (let i=startsutra;i<endsutra;i++) {
        const pages=TaishoJuanPage[i-1];
        const at=bsearchNumber(pages,pn+1);
        if (~at && pages[at]>=pn) {
            if (i==2921) {
                return [220, at+200]; //大般若經 200~400
            } else if (i==2922) {
                return [220, at+400]; //大般若經 400~600
            }
            if (i>0 && at==0) { //return last juan of previous sutra
                return [i-1 , TaishoJuanPage[i-2].length ];
            } else {
                return [i,at];
            }
        }
    }
    return [0,0];
}
export const getSutraInfo=(ptk,no)=>{
    const catalog=ptk.columns.catalog;
    if (typeof no=='number') no=no.toString().padStart(4,'0');
    const at=catalog.keys.indexOf(no);
    return {title:catalog.title[at], bulei:catalog.bulei[at], author:catalog.author[at] , no};
}
export const TaishoSutraCode={
    1:'agmd',
    26:'agmm',
    99:'agms',
    100:'agmss', //shorter samyutta agama
    125:'agmu',
}
export const nextColumn=(obj)=>{
    if (obj.col===2) {
        obj.col=0;
        obj.page++;
    } else if (obj.col<2 ) obj.col++
    return obj;
}
export const meta_cbeta={translatePointer, parseFile,parseBuffer,onOpen,onClose,
    createChunkId:createChunkId_cbeta,
    insertTag:insertTag_cbeta,
    offGen:offGen_cbeta,
    buildCharMap:buildCharMap_cbeta,
    StockCharMap:StockCharMap_cbeta,
    parseRefTarget,
    TaishoMaxPage,
    TaishoVolSutra,
    TaishoJuanPage,
    TaishoSutraCode,
    tidy,
    getSutraInfo,
    TaishoJuanFromPage,
    TaishoPageFromJuan,
    fromCBETA, toCBETA,
    parseVolNoPage, //行首格式
    nextColumn,
    nullify:nullify_cbeta
};

addTemplate('cbeta',{TaishoMaxPage, guidedrawer:'cbeta'} );