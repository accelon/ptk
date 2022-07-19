import {OFFTAG_REGEX_G, OFFTAG_NAME_ATTR,ALWAYS_EMPTY,OFFTAG_COMPACT_ID,
    QUOTEPAT,QUOTEPREFIX,QSTRING_REGEX_G,QSTRING_REGEX_GQUOTEPAT,
    OFFTAG_LEADBYTE} from './constants.ts';
import {IOfftag} from './interfaces.ts';
import {closeBracketOf,substrUTF32} from '../utils/index.ts'
const parseCompactAttr=(str:string)=>{  //              序號和長度和標記名 簡寫情形，未來可能有 @ 
    const out={}, arr=str.split(/([@#~])/);
    while (arr.length) {
        let v=arr.shift();
        if      (v==='~') out['~']=arr.shift();  
        else if (v==='@') out['@']=arr.shift();  // a pointer
        else if (v==='#') {
                v=arr.shift();
                const m=v.match(OFFTAG_COMPACT_ID); //id with numeric leading may omit #
                if (m) out.id=m[1];
        } else {
            out.id=v;
        }
    }
    return out;
}
const parseAttributes=(rawAttrs:string,compactAttr:string)=>{
    let quotes=[];             //字串抽出到quotes，方便以空白為拆分單元,
    const getqstr=(str,withq)=>str.replace(QUOTEPAT,(m,qc)=>{
        return (withq?'"':'')+quotes[parseInt(qc)]+(withq?'"':'');
    });

    let rawattr=rawAttrs?rawAttrs.substr(1,rawAttrs.length-2).replace(QSTRING_REGEX_G,(m,m1)=>{
        quotes.push(m1);
        return QUOTEPREFIX+(quotes.length-1);
    }):'';
    const attrarr=rawattr.split(/( +)/), attrs={};       //至少一個空白做為屬性分隔

    let i=0;
    if (compactAttr) Object.assign(attrs, parseCompactAttr(compactAttr));
    while (attrarr.length) {
        const it=attrarr.shift();
        let eq=-1,key='';
        if (it[0]=='~' || it[0]=='#' || it[0]=='@')  { //short form
           key=it[0];
           if (key=='#') key='id';
           eq=(it[1]=='=')?1:0;
        } else {
           eq=it.indexOf('=');
           if (eq>0) key=it.substr(0,eq);
        }
        if (eq>-1) {
            attrs[key] = getqstr(it.substr(eq+1));
            if (attrarr.length && !attrarr[0].trim()) attrarr.shift() ;//drop the following space
        } else {
            if (it) attrs[it] = true;
        }
        i++
    }

    return attrs;
}
export const parseOfftag=(raw:string,rawAttrs:string)=>{ // 剖析一個offtag,  ('a7[k=1]') 等效於 ('a7','[k=1]')
    if (raw[0]==OFFTAG_LEADBYTE) raw=raw.substr(1);
    if (!rawAttrs){
        const at=raw.indexOf('[');
        if (at>0) {
            rawAttrs=raw.substr(at);
            raw=raw.substr(0,at);
        }
    }
    let [m2, tagName, compactAttr]=raw.match(OFFTAG_NAME_ATTR);
    let attrs=parseAttributes(rawAttrs,compactAttr);
    return [tagName,attrs];
}

const resolveEnd=(raw, plain:string,tags:IOfftag[])=>{  
//文字型的範圍，已知原字串終點，計算正字串長度(utf16)
    for (let i=0;i<tags.length;i++) {
       const tag=tags[i];
       let j=i;
       if (tag.end>tag.start && !tag.width) { //已知 rawtext 座標，換算回plaintext座標
           while (j<tags.length && tag.end > tags[j].start) j++;
           if ((j<tags.length && tags[j].start>tag.end) || j==tags.length) j--;
           const closest = (j<tags.length)?tags[j]:tag; //最接近終點的 tag

           tag.width=tag.end - closest.start     //從closest 到本tag終點之間的的正字串距離 即 原字串距離
           tag.width+= closest.choff - tag.choff //closest 和 tag 正字串距離
       } 
    }
//數字型的範圍，已知正字串長度(offtext 標記提供以 utf32為單位)，計算原字串終點
    for (let i=0;i<tags.length;i++) {
        const tag=tags[i];
        if (tag.width && tag.end==tag.start) {//已知width ，計算end
            //轉換utf32 個數為 utf16 個數
            tag.width=substrUTF32(plain, tag.choff, tag.width).length;
            let j=i+1;
            while (j<tags.length&&tag.choff+tag.width > tags[j].choff) j++;
            if ((j<tags.length && tags[j].choff>tag.choff+tag.width) || j==tags.length) j--;
            const closest = (j<tags.length)?tags[j]:tag;
             //最接近終點的 tag，再無其他tag ，即正字串原字串定位相同
            if (closest===tag) {
                tag.end+=tag.width;  //到終點前無其他tag，直接加上 width 即可
            } else { //
                tag.end = closest.start //取 closest 的原字串位置 加上
                        +(tag.choff+tag.width-closest.choff);  
                //tag.choff+tag.width 正字串長度 - closest 的正字串座標 即 正字串個數=原字串個數
            }
       }
   }
}
export const stripOfftag=(str:string)=>str.replace(OFFTAG_REGEX_G,'');

export const parseOfftext=(str:string,idx:number=0)=>{
    if (str.indexOf('^')==-1) return [str,[]];
    let tags=[];
    let choff=0,prevoff=0; // choff : offset to plain text
    let text=str.replace(OFFTAG_REGEX_G, (m,rawName,rawAttrs,offset)=>{
        let [tagName,attrs]=parseOfftag(rawName,rawAttrs);
        let width=0;
        let start=offset+m.length, end=start; //文字開始及結束
        let endch=attrs['~'];
        if (endch) { //數字型終點
            if(isNaN(parseInt(endch))) { //終字
                width=0;
                let repeat=0;
                const m=endch.match(/\+(\d+)$/);
                if (m) {
                    endch=endch.slice(0,endch.length-m.length);
                    repeat=parseInt(m[1]);
                }

                let at=str.indexOf(endch,start);
                while (~at && repeat) {
                    at=str.indexOf(endch,at+1);
                    repeat--;
                }
                if (~at) {
                    end=at+endch.length;
                    delete attrs['~']; //resolved, remove it
                }
            } else { //往後吃w色字，不含其他標記，一對surrogate 算一字
                width=parseInt(endch); //這是utf32 的個數
            }
            //tag.end resolveEnd 才知道
        } else { //以括號指定區間
            const closebracket = closeBracketOf(str.charAt(start));
            if (closebracket ) { //offtag 屬性不能帶括號
                const at=str.indexOf(closebracket,start+1);
                if (~at) end=at+ closebracket.length; //包括括號
            }
        }
        const aoffset=offset+rawName.length+1;
        choff+= offset-prevoff;            //目前文字座標，做為標記的起點
		let offtag : IOfftag = {name:tagName,offset,aoffset, attrs, idx, line:0, choff, width, start,end}
        tags.push( offtag );
        choff -= m.length;  
        prevoff=offset;
        return '';
    })
    resolveEnd(str, text,tags);
    return [text,tags];
}
export interface IOfftext {raw:string, plain:string , tags:IOfftag[]} ;

export const updateOfftext = (rawtext:string, tag:IOfftag, newtag:IOfftag) =>{
    for (let n in newtag.attrs) {
        if (newtag.attrs[n] != tag.attrs[n]) { //parse Number no need to update
            let newvalue=typeof newtag.attrs[n]!=='string'?JSON.stringify(newtag.attrs[n]):newtag.attrs[n];
            if (newvalue.indexOf(' ')>0) {
                newvalue='"'+newvalue+'"';
            }
            const regex=new RegExp('\\b'+n+' *= *"?'+tag.attrs[n]+'"?');
            rawtext=rawtext.replace(regex,n+'='+newvalue);
        }
    }
    return rawtext;
}
export class Offtext {
    constructor(raw:string) {
        this.raw=raw;
        [this.plain, this.tags]=parseOfftext(raw);
    }
    tagRawText(tag:number|Offtag):string {
        return this.tagText(tag,true);
    }
    tagText(tag:number|Offtag,raw=false):string {
        if (typeof tag=='number') tag=this.tags[tag];
        if (!tag) return;
        return raw?this.raw.slice(tag.start,tag.end):this.plain.slice(tag.choff,tag.choff+tag.width);
    }
}