import {OFFTAG_REGEX_G, OFFTAG_NAME_ATTR,ALWAYS_EMPTY,OFFTAG_ID,
    QUOTEPAT,QUOTEPREFIX,QSTRING_REGEX_G,QSTRING_REGEX_GQUOTEPAT,OFFTAG_LEADBYTE} from './constants.ts';
import {OffTag} from './interfaces.ts';
import {findCloseBracket} from '../utils/cjk.ts'
const parseCompactAttr=(str:string)=>{  //              序號和長度和標記名 簡寫情形，未來可能有 @ 
    const out={}, arr=str.split(/([@#])/);
    while (arr.length) {
        let v=arr.shift();
        // if      (v==='~') out['~']=arr.shift();  
        if (v==='@') out['@']=arr.shift();  // a pointer
        else { 
            if (v==='#') v=arr.shift(); 
            const m=v.match(OFFTAG_ID); //id with numeric leading may omit #
            if (m) out.id=m[1];
        }
    }
    return out;
}
const parseAttributes=(rawA:string,compactAttr:string)=>{
    let quotes=[];             //字串抽出到quotes，方便以空白為拆分單元,
    let putback='';            //標記中非屬性的文字，放回正文
    const getqstr=(str,withq)=>str.replace(QUOTEPAT,(m,qc)=>{
        return (withq?'"':'')+quotes[parseInt(qc)]+(withq?'"':'');
    });

    let rawattr=rawA?rawA.substr(1,rawA.length-2).replace(QSTRING_REGEX_G,(m,m1)=>{
        quotes.push(m1);
        return QUOTEPREFIX+(quotes.length-1);
    }):'';
    const attrarr=rawattr.split(/( +)/), attrs={};       //至少一個空白做為屬性分隔

    let i=0;
    if (compactAttr) Object.assign(attrs, parseCompactAttr(compactAttr));
    while (attrarr.length) {
        const it=attrarr.shift();
        let eq=-1,key='';
        if (it[0]=='~' || it[0]=='#' || it[0]=='@')  {
           key=it[0];
           eq=0;
        } else {
           eq=it.indexOf('=');
           if (eq>0) key=it.substr(0,eq);
        }
        if (eq>-1) {
            attrs[key] = getqstr(it.substr(eq+1));
            if (attrarr.length && !attrarr[0].trim()) attrarr.shift() ;//drop the following space
        } else {
            putback+=getqstr(it,true);
        }
        i++
    }

    return [attrs,putback];
}
export const parseOffTag=(raw:string,rawA:string)=>{ // 剖析一個offtag,  ('a7[k=1]') 等效於 ('a7','[k=1]')
    if (raw[0]==OFFTAG_LEADBYTE) raw=raw.substr(1);
    if (!rawA){
        const at=raw.indexOf('[');
        if (at>0) {
            rawA=raw.substr(at);
            raw=raw.substr(0,at);
        }
    }
    let [m2, tagName, compactAttr]=raw.match(OFFTAG_NAME_ATTR);
    let [attrs,putback]=parseAttributes(rawA,compactAttr);
    return [tagName,attrs,putback];
}

const resolveTagWidth=(line:string,tags:OffTag[])=>{  
//正文已準備好，可計算標記終點，TWIDTH 不為負值，只允許少數TWIDTH==0的標記(br,fn) ，其餘自動延伸至行尾
    tags.forEach( (tag: offTag )=>{
        const w=tag.attrs['~'];
        if (w) {                    //以文字標定結束位置
            if (!ALWAYS_EMPTY[tag.name]) {
                const pos=line.indexOf(w);
                if (pos>0) tag.w=pos-tag.x+1; 
                else tag.w=0;
            } else tag.w=0;
            delete tag.attrs['~'];
        } else if ( 0 > tag.w ) {  //負值轉換為正值（從標記起算)
            // if ( tag.w==-1) {
            //     tag.w=0; //空標籤自動延至至行尾
            // } else {
                tag.w= tag.w +line.length+1; 
                if (tag.w<0) tag.w=0;    
            // }
        }
        if (tag.name=='t' && !tag.w) { //找到下一個括號結束點
            const closebracket=findCloseBracket(line,tag.x);
            if (closebracket) tag.w=closebracket-tag.x;
        }
    })
}
export const parseOfftextLine=(str:string,idx:number=0)=>{
    if (str.indexOf('^')==-1) return [str,[]];
    let tags=[];
    let textoffset=0,prevoff=0;
    let text=str.replace(OFFTAG_REGEX_G, (m,rawName,rawA,offset)=>{
        let [tagName,attrs,putback]=parseOffTag(rawName,rawA);
        let width=0;
        putback=putback.trimRight();     //[xxx ] 只會放回  "xxx"
        if (tagName=='br' && !putback) { //標記前放一個空白, 接行後不會 一^br二  => 一 二
            putback=' ';                 // 用 ^r 折行則不會加空白，適合固定版式的中文。
            offset++
        }
        const W=attrs['~'];
        if (W && !isNaN(parseInt(W))) { //數字型終點
            width=ALWAYS_EMPTY[tagName]?0:parseInt(W); 
            delete attrs['~'];
        }
        width=putback.length?putback.length:width;

        // if (width==0 ) width=-1;

        textoffset+= offset-prevoff;            //目前文字座標，做為標記的起點
        let offtag : Offtag = {name:tagName, attrs, idx, y:0, x:textoffset, w:width, offset}
        tags.push( offtag );
        textoffset+=putback.length - m.length;  
        prevoff=offset;
        return putback;
    })
    resolveTagWidth(text,tags);
    return [text,tags];
}
export const extractTag=(buf:string,opts={})=>{
    const alltags=[];
    const tagname=opts.tagname;
    const line=opts.line||0;
    const lines=buf.split(/\r?\n/);
    for (let i=0;i<lines.length;i++) {
        const [text,tags]=parseOfftextLine(lines[i]);
        const rawtags=tagname?tags.filter(it=>it.name.startsWith(tagname)):tags;
        rawtags.forEach(tag=>{
            alltags.push({line:line+i, id: tag.attrs.id, name:tag.name ,text:text.slice(tag.offset,tag.w) })
        })
    }
    return alltags;
}
