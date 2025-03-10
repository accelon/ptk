import {OFFTAG_REGEX_G, OFFTAG_REGEX,OFFTAG_REGEX_TOKENIZE,OFFTAG_NAME_ATTR,ALWAYS_EMPTY,OFFTAG_COMPACT_ID,
    QUOTEPAT,QUOTEPREFIX,QSTRING_REGEX_G,QSTRING_REGEX_GQUOTEPAT,
    OFFTAG_LEADBYTE} from './constants.ts';
import {IOfftag} from './interfaces.ts';
import { removeBracket } from '../utils/cjk.ts';

import { closeBracketOf} from '../utils/cjk.ts'
import {substrUTF32} from '../utils/unicode.ts'
import {IToken,Token, TokenType, tokenize} from '../fts/tokenize.ts'
import {jsonify, extractObject } from '../utils/json.ts';
const parseCompactAttr=(str:string)=>{  //              序號和長度和標記名 簡寫情形，未來可能有 @ 
    const out={}, arr=str.split(/([@#~])/);
    while (arr.length) {
        let v=arr.shift();
        if      (v==='~') out['to']=arr.shift();  
        else if (v==='@') out['ln']=arr.shift();  // a pointer
        else if (v==='#') {
                v=arr.shift()||'';
                const m=v.match(OFFTAG_COMPACT_ID); //id with numeric leading may omit #
                if (m) out.id=m[1];
        } else {
            out.id=v;
        }
    }
    return out;
}
export const parseAttributes=(rawAttrs:string,compactAttr:string)=>{
    let quotes=Array<string>();             //字串抽出到quotes，方便以空白為拆分單元,
    const getqstr=(str:string,withq:boolean=false):string=>str.replace(QUOTEPAT,(m,qc)=>{
        return (withq?'"':'')+quotes[parseInt(qc)]+(withq?'"':'');
    });

    let rawattr=rawAttrs?rawAttrs.slice(1,rawAttrs.length-1).replace(QSTRING_REGEX_G,(m,m1)=>{
        quotes.push(m1);
        return QUOTEPREFIX+(quotes.length-1);
    }):'';
    const attrarr=rawattr.split(/( +)/), attrs={};       //至少一個空白做為屬性分隔

    let i=0;
    if (compactAttr) Object.assign(attrs, parseCompactAttr(compactAttr));
    while (attrarr.length) {
        const it=attrarr.shift()||'';
        let eq=-1,key='';
        if (it[0]=='~' || it[0]=='#' || it[0]=='@')  { //short form
           key=it[0];
           if (key=='#') key='id';
           if (key=='@') key='ln';
           if (key=='~') key='to';
           eq=(it[1]=='=')?1:0;
        } else {
           eq=it.indexOf('=');
           if (eq>0) key=it.slice(0,eq);
        }
        if (eq>-1) {
            attrs[key] = getqstr(it.slice(eq+1));
            if (attrarr.length && !attrarr[0].trim()) attrarr.shift() ;//drop the following space
        } else {
            if (it) attrs[it] = true;
        }
        i++
    }

    return attrs;
}
// 剖析一個offtag,  ('a7[k=1]') 等效於 ('a7','[k=1]')
// 接受 <a=33 b=44>(舊格式) 或 {a:33,b:44}

export const parseOfftag=(raw:string,rawAttrs:string):[string,Record<string,any>]=>{ 
    let attrs={};
    if (raw[0]==OFFTAG_LEADBYTE) raw=raw.slice(1);
    if (rawAttrs) {
        if (rawAttrs[0]!=='<' && rawAttrs[0]!=='{') {
            //attrs.innertext=removeBracket(rawAttrs);
            rawAttrs='';
        } else {
            const at=raw.indexOf('<');
            const at2=raw.indexOf('{');
            if (at2>0) {
                rawAttrs=raw.slice(at);
                raw=raw.slice(0,at);
            } else if (at>0) {
                rawAttrs=raw.slice(at);
                raw=raw.slice(0,at);
            }
        }    
    }

    const o=raw.match(OFFTAG_NAME_ATTR);
    if (!o) {
        console.log("\ninvalid tag, raw",raw,'attr',rawAttrs);
        return [raw,{}];
    } else {
        let [m2, tagName, compactAttr]=o;
        
        if (rawAttrs&&rawAttrs.charAt(0)=='{') {
            const attrs2=jsonify(rawAttrs);
            attrs=parseAttributes('',compactAttr);
            for (let key in attrs2) {
                attrs[key]=attrs2[key];
            }
        } else {
            if (compactAttr || rawAttrs) attrs=parseAttributes(rawAttrs,compactAttr);
        }        
        return [tagName,attrs];            
    }
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

export const parseOfftext=(str:string,line:number=0):[string,Array<IOfftag>]=>{
    if (!str || str.indexOf('^')==-1) return [str||'',[]];
    let tags=Array<IOfftag>();
    let choff=0,prevoff=0; // choff : offset to plain text
    let text=str.replace(OFFTAG_REGEX_G, (m,rawName,rawAttrs,offset)=>{
        if (!rawName) {//may be transclusion
            if (rawAttrs&&rawAttrs.startsWith('[')) {
                const transclusiontag: IOfftag ={name:'',offset,aoffset:offset+1, attrs:{}, 
                    line, choff, width:0, start:offset+2,end:offset+rawAttrs.length, active:false }
                tags.push(transclusiontag);
                const innertext=removeBracket(rawAttrs);
                return innertext;
            }
            return '';
        }
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
		let offtag : IOfftag = {name:tagName,offset,aoffset, attrs, 
            line, choff, width, start,end, active:false }
        tags.push( offtag );
        choff -= m.length;  
        prevoff=offset;
        return '';
    })
    resolveEnd(str, text,tags);

    //need one concreate char to hold tag at the end
    if (tags.length && tags[tags.length-1].choff>=text.length) {
        text+=' ';
    }
    return [text,tags];
}

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
    raw:string;
    plain:string;
    tags:Array<IOfftag>
    constructor(raw:string,line:number=0) {
        this.raw=raw;
        //let plain,tags;
        let [plain, tags]=parseOfftext(raw,line);
        this.plain=plain;
        this.tags=tags;
    }
    getTag(ntag:number){
    	return this.tags[ntag];
    }
    tagText(tag:number|IOfftag,raw=false):string {
        if (typeof tag=='number') tag=this.tags[tag];
        if (!tag) return '';
        return raw?this.raw.slice(tag.start,tag.end):this.plain.slice(tag.choff,tag.choff+tag.width);
    }
    tagRawText(tag:number|IOfftag):string {
        return this.tagText(tag,true);
    }
}
export const packOfftagAttrs=(attrs,opts={omit:Boolean,allowEmpty:Boolean})=>{
    let out='';
    const omit=opts.omit||false;
    const allowEmpty=opts.allowEmpty||false;
    for (let key in attrs) {
        if (omit && omit[key]) continue;
        let v=attrs[key];
        if (v.indexOf(" ")>-1|| (!v&&opts?.allowEmpty)  ) {
            v='"'+v.replace(/\"/g,'\\"')+'"'; 
        }
        if (out) out+=' ';
        if (attrs[key] && !allowEmpty) out+=key+'='+v;
    }
    return out.trim();
}
//將offtext剖為處理單元, 可直接送給indexer或繪製處理，offtag不searchable，故不會增加 tkoff
//Token 的text全部接起來，會是輸入的str ，一個byte 不差
export const tokenizeOfftext=(str:string):Array<IToken>=>{
    let out=Array<IToken>();
    let tkoff=0,choff=0;
    const addSnippet=(snippet:string)=>{ //不含offtag 的文字段
        if (!snippet) return;
        const tokens=tokenize(snippet)||[];
        out=out.concat(tokens);
        if (tokens.length) {
            const tkcount=out[out.length-1].tkoff //此snippet 有多少個token?
            + (out[out.length-1].type>=TokenType.SEARCHABLE?1:0) ; 
            //如果最後一個token 是SEARCHABLE ，則 tkcount要加一
            tokens.forEach(it=>{ //位移snippet之前的choff和tkoff
                it.choff+=choff;
                it.tkoff+=tkoff;
            });
            tkoff+=tkcount;
        }    
    }
    str.replace(OFFTAG_REGEX_TOKENIZE, (m,rawName:string,rawAttrs,offset:number)=>{
        const prevtext=str.slice(choff,offset);
        addSnippet(prevtext); //到上一個offtag 之間的文字
        const thetag=str.slice(offset,offset+m.length);
        //將tag及attributes原封不動作為一個token，之後有需要再parse它
        const tk=new Token( thetag , offset, tkoff, TokenType.OFFTAG);
        out.push(tk);
        choff=offset+m.length;//文字開始之後 , offtext/parser.ts::parseOfftext , 附屬於tag 的文字，視為正常字
    })
    addSnippet(str.slice(choff)); //最後一段文字

    return out;
}
//這是一個^f1句子   
//這是兩個^f2【二】句子 

export const sentencize=(linetext:string='',line:number)=>{
    const tokens=tokenizeOfftext(linetext); 
    const sentences=Array<IToken>();
    let prevcjk=-1;//避免被短標記破開
    for (let i=0;i<tokens.length;i++) {
        const tk=tokens[i];
        if (tk.type>TokenType.SEARCHABLE) {
            if (i&& sentences.length &&tk.type&TokenType.CJK && prevcjk>-1 ) {
                tokens[prevcjk].text+=tk.text;
            } else {
                tk.line=line;
                sentences.push(tk);
                if (tk.type&TokenType.CJK) prevcjk=i;
                else prevcjk=-1;
            }
        } else {
            if ( !tk.text.match(OFFTAG_REGEX) ) prevcjk=-1; //如果被破開，就不會接繼到最後一個 cjk token
            sentences.push(tk);
        }
    }
    return sentences;
}
export const eatofftag=(str:string)=>{ 
    let thetag='',p=0;
    let ch=str.charAt(0);
    if (ch=='{') {
        const [obj,len]=extractObject(str);
        return str.slice(0,len);
    }
    while (thetag.length<128 && ch && p<str.length) {
        const cp=str.charCodeAt(p)||0;
        if ( (cp>0x2d&&cp<=0x3b)|| (cp>=0x61&&cp<=0x7a)
            ||cp==0x40||cp==0x23 ||cp==0x5f||cp==0x7e){ // -./0123456789:;_#@   a-z ~  
            thetag+=ch;
            p++
        } else {
            break;
        }
        ch=str.charAt(p);
    }
    return thetag;
}
export const eatbracket=(str:string,breaker='\t',stop:any=null)=>{ //consume continous brackets
    let out='',p=0;
    let ch=str.charAt(p);
    let closebracket=closeBracketOf(ch);
    if (!stop) stop=[];
    while (closebracket) {
        const at2=str.indexOf(closebracket, p+1);
        if (at2==-1) { // no matching , wrong tag, quit
            break;
        }
        out+=str.slice(p,at2+1);
        if(breaker) out+=breaker;
        p=at2+1;
        if (~stop.indexOf(ch)) break;
        ch=str.charAt(p);
        closebracket=closeBracketOf(ch);
    }
    return out.slice(0,out.length-breaker.length);
}

export const unitize=(str:string)=>{
    if (!str) return [];
    const out=''.split('');
    let prev=0;
    let at=str.indexOf('^',prev);

    // make sure sum of items' length == str.length
    while (~at) {
        let p=at+1; //temporary pointer 
        let ch=str.charAt(p);
        if (ch=='^') { //escaping
            at=str.indexOf('^',p+1);
            continue;
        }
        let prevtext='';
        const offtag=eatofftag(str.slice(p));
        prevtext=str.slice(prev,p-1);
        if (prevtext) out.push(prevtext);
        const brackets=eatbracket(str.slice(p+offtag.length),'', ['[','{','<']);
        out.push( '^'+str.slice(p,p+brackets.length+offtag.length));
        p+=offtag.length;
        prev = brackets.length+ p;
        at=str.indexOf('^',prev);
    }

    if (str.length>prev) {
        let s=str.slice(prev);
        if (s) out.push(s);
    }
    return out;
}
export const offTagType=(str:string)=>{
    const offtag=eatofftag(str);
    str=str.slice(offtag.length);
    const ch=str.charAt(0)
    
    if (closeBracketOf(ch)) {
        if (ch==='['){
            return [str.slice(1,str.length-1), "transclusion", offtag]
        } else if (ch==='<' && !offtag.length) {
            return [str, "html", offtag]
        } else {
            if (offtag.charAt(0)=='{') { //json as offtag
                try{
                    const r=jsonify(offtag);
                    return [offtag , 'offtext', ""]
                } catch(e) {
                    return [str , 'unknown',offtag]
                }    
            }
            return [str, "offtext", offtag]//just remove ^, keep bracket
        }
    } else {
        if (!str) return ["",'offtext',offtag] ;//without brackets
        try{
            const r=jsonify(offtag);
            return [str , 'offtext',offtag]
        } catch(e) {
            return [str , 'unknown',offtag]
        }
    }
}
//  page 
//  page.line    // line must be number
//  page@book
//  page@book.lineoff 
//  page.line@book
export const parsePageBookLine=(addr:string):[string,string,number]=>{
	let lineoff=0;
	const m=addr.match(/\.(\d+)/);
	if (m) {
		lineoff=parseInt(m[1]);
        addr=addr.replace(m[0],'');
	}
	let [page,book]=addr.split('@');

	return [page,book,lineoff]	;
}
//parse a complete transclusion with chinese
export const parseTransclusion=(str:string)=>{
    if (str.startsWith('^')) str=str.slice(1);
    let tag='',innertext=str;
    if (!str.indexOf('[')) {
        tag=eatofftag(str);
        innertext=removeBracket(str.slice(tag.length));
    }

    const at=innertext.indexOf('|');
    let caption=innertext;
    if (at>0) {
        caption=innertext.slice(0,at)
        innertext=innertext.slice(at+1);
    }
    return [tag,innertext,caption];
}