import {OFFTAG_REGEX_G, OFFTAG_NAME_ATTR,ALWAYS_EMPTY,OFFTAG_COMPACT_ID,
    QUOTEPAT,QUOTEPREFIX,QSTRING_REGEX_G,QSTRING_REGEX_GQUOTEPAT,
    OFFTAG_LEADBYTE} from './constants.ts';
import {IOfftag} from './interfaces.ts';
import {closeBracketOf} from '../utils/cjk.ts'
const parseCompactAttr=(str:string)=>{  //              序號和長度和標記名 簡寫情形，未來可能有 @ 
    const out={}, arr=str.split(/([@#])/);
    while (arr.length) {
        let v=arr.shift();
        // if      (v==='~') out['~']=arr.shift();  
        if (v==='@') out['@']=arr.shift();  // a pointer
        else { 
            if (v==='#') v=arr.shift(); 
            const m=v.match(OFFTAG_COMPACT_ID); //id with numeric leading may omit #
            if (m) out.id=m[1];
        }
    }
    return out;
}
const parseAttributes=(rawA:string,compactAttr:string)=>{
    let quotes=[];             //字串抽出到quotes，方便以空白為拆分單元,
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
export const parseOfftag=(raw:string,rawA:string)=>{ // 剖析一個offtag,  ('a7[k=1]') 等效於 ('a7','[k=1]')
    if (raw[0]==OFFTAG_LEADBYTE) raw=raw.substr(1);
    if (!rawA){
        const at=raw.indexOf('[');
        if (at>0) {
            rawA=raw.substr(at);
            raw=raw.substr(0,at);
        }
    }
    let [m2, tagName, compactAttr]=raw.match(OFFTAG_NAME_ATTR);
    let attrs=parseAttributes(rawA,compactAttr);
    return [tagName,attrs];
}

const resolveEnd=(raw, plain:string,tags:IOfftag[])=>{  
//正文已準備好，可計算標記終點，TWIDTH 不為負值，只允許少數TWIDTH==0的標記(br,fn) ，其餘自動延伸至行尾
    for (let i=0;i<tags.length;i++) {
       const tag=tags[i];
       if (tag.end>tag.start && !tag.width) { //已知 rawtext 座標，換算回plaintext座標
            let j=i;
            while (j<tags.length && tag.end > tags[j].start) j++;
            if ((j<tags.length && tags[j].start>tag.end) || j==tags.length) j--;
            const closest = (j<tags.length)?tags[j]:tag; //最接近終點的 tag
            tag.width=tag.end - closest.start     //從closest 到本tag終點之間的的純文字距離
            tag.width+= closest.choff - tag.choff //closest 和 tag 純文距離
       }
    }
}
export const stripOfftag=(str:string)=>str.replace(OFFTAG_REGEX_G,'');

export const parseOfftext=(str:string,idx:number=0)=>{
    if (str.indexOf('^')==-1) return [str,[]];
    let tags=[];
    let choff=0,prevoff=0; // choff : offset to plain text
    let text=str.replace(OFFTAG_REGEX_G, (m,rawName,rawA,offset)=>{
        let [tagName,attrs]=parseOfftag(rawName,rawA);
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
            } else { //往後吃w 字，不含其他標記
                width=parseInt(endch);
            }
            //tag.end resolveEnd 才知道
        } else { //以括號指定區間
            const closebracket = closeBracketOf(str.charAt(start));
            if (closebracket ) { //offtag 屬性不能帶括號
                const at=str.indexOf(closebracket,start+1);
                if (~at) end=at+ closebracket.length; //包括括號
            }
        }
        choff+= offset-prevoff;            //目前文字座標，做為標記的起點
		let offtag : IOfftag = {name:tagName, attrs, idx, line:0, choff, width, start,end}
        tags.push( offtag );
        choff -= m.length;  
        prevoff=offset;
        return '';
    })
    resolveEnd(str, text,tags);
    return [text,tags];
}
export interface IOfftext {raw:string, plain:string , tags:IOfftag[]} ;

export class Offtext {
    constructor(raw:string) {
        this.raw=raw;
        [this.plain, this.tags]=parseOfftext(raw);
    }
    tagText(ntag:number, raw:false):string {
        if (!this.tags[ntag]) return;
        if (raw) {
            return this.raw.slice(this.tags[ntag].start,this.tags[ntag].end);    
        } else {
            return this.plain.slice(this.tags[ntag].choff,this.tags[ntag].choff+this.tags[ntag].width);
        }
        
    }
}