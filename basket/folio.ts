//import { bsearchNumber ,parseOfftext,splitUTF32Char,CJKRangeName} from "../nodebundle.cjs";

import {bsearchNumber,splitUTF32Char,CJKRangeName ,styledNumber,toVerticalPunc} from '../utils/index.ts';
import {parseOfftext } from '../offtext/index.ts';

export const MAXFOLIOLINE=8, MAXFOLIOCHAR=32;
export const VALIDPUNCS="「」『』。，；：、！？"

export const tidyFolioText=text=>{
    //方括號的文字不算
    return text.replace(/【([^】]*)】/g,(m,m1)=>'【'+ '-'.repeat(m1.length) +'】')
}
export const toFolioText=lines=>{
    if (!lines || !lines.length) return [];
    let firstline=lines[0];
    let m=firstline.match(/(\^pb\d+)/);
    if (!m) { //lines[0]=firstline.slice( m?.index +m[1].length);
        console.log("missing pb markup at first line",firstline);
    }
    const text=tidyFolioText(lines.join('\t'))
    //.replace(/\^folio#[a-z\d]+【([^】]+?)】/g,'')// 只作為 foliolist 的名字，查字典內文用不到
    .replace(/(..)\^pb/g,'$1^lb^pb') //replace in middle pb
    .split('^lb');
    // if (remain) text.push(remain);
    return text;
}
export const concreateLength=(linetext)=>{
    let [text,tags]=parseOfftext(linetext);
    const isgatha=!!tags.filter(it=>it.name=='gatha').length;
    if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
    const chars=splitUTF32Char(text);
    let i=0,chcount=0;
    while (i<chars.length) {
        const r=CJKRangeName(chars[i]);
        if (r || chars[i]=='　') {
            chcount++;
        }
        i++;    
    }
    return chcount;
}
export const getConcreatePos=(linetext,nth,nextline)=>{
    let [text,tags]=parseOfftext(linetext);
    const isgatha=!!tags.filter(it=>it.name=='gatha').length;
    if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
    let ntag=0;
    const chars=splitUTF32Char(text);
    let pos=0, i=0, tagstart=0;
    if (ntag<tags.length && pos>=tags[ntag].choff) tagstart=tags[ntag].start;
    while (nth&& i<chars.length) {
        const r=CJKRangeName(chars[i]);
        if (r || chars[i]=='　') {
            nth--;
        }
        pos+=chars[i].codePointAt(0)>=0x20000?2:1;
        if (ntag<tags.length &&  pos>=tags[ntag].choff ) {
            if (ntag<tags.length) tagstart=tags[ntag].start;
            ntag++;
        }
        i++;
    }
    while (i<chars.length) { //skip leading punc
        const r=CJKRangeName(chars[i]);
        if (!r) { // a punc
            pos++;
        } else break;
        i++;
    }
    let textbefore='';
    let s=text.slice(pos);
    const chpos=pos;
    if (pos>0) {
        const befores= splitUTF32Char(text.slice(0,pos));
        let back=befores.length-1;

        while (pos>0 && back>0 && CJKRangeName(befores[back])) {
            textbefore=befores[back]+textbefore;
            back--;
            pos--;
        }
    }
    if (textbefore) textbefore=textbefore+'^';
    if (nextline) {
        const [nextlinetext]=parseOfftext(nextline);
        s=s+nextlinetext;
    }
    // returh "pure text with ^ " ,   offset of offtext
    return [textbefore+s,chpos + tagstart ];
}

export class FolioText {
    constructor (ptk){
        this.ptk=ptk;
        this.offtext='';
        this.pbs=[];
        this.pbpos=[];   //pb 的起點，不算標記本身
        this.chunks=[];
        this.chunkpos=[]; //chunk 的起點，不算標記本身
        this.ck=ptk.defines.ck;
    }
    toFolioPos(ck='1',lineoff=0,choff=0) {
        const [ckstart,ckend]=this.chunkRange(ck);
        const str=this.offtext.slice(ckstart,ckend);
        let p=0;
        while (lineoff>0 && p<str.length) {
            if (str.charAt(p)=='\n') lineoff--;
            p++;
        }
        const start=ckstart+p;
        const pbat=bsearchNumber(this.pbpos,start)-1;
        const  [pbstart,pbend]=this.pbRange(this.pbs[pbat]);

        const end=Math.min(start,pbend)
        const pbstr=this.offtext.slice(pbstart,end );

        const pblines=pbstr.split('^lb');
        const line=pblines.length;
        const ch=concreateLength(pblines[pblines.length-1]);
        return [this.pbs[pbat], line-1,ch ];
    }
    folioPageText(pb){
        const [start,end]=this.pbRange(pb);
        return toFolioText(this.offtext.slice(start,end).split('\n'));
    }
    fromFolioPos(foliopos,line,ch) {
        let pbid=foliopos;
        if (typeof foliopos=='object') {
            [pbid, line,ch ]=foliopos;
        }       
        
        const [pbstart,pbend]=this.pbRange(pbid);
        const pbstr=tidyFolioText(this.offtext.slice(pbstart,pbend ))
            
        const pblines=pbstr.split('^lb');
        // console.log(pblines,pbstart,pbend,pbid)
        let start=pbstart||0;
        for (let i=0;i<line;i++) {
            start+=pblines[i].length+3; //\n and "^lb".length
        }
        const pbchoff=getConcreatePos(pblines[line],ch)[1]; //與 pblinestart 的距離
        start+=pbchoff;
        let ckat=bsearchNumber(this.chunkpos, start )-1;
        const ckid=this.chunks[ckat<0?0:ckat];
        const  [ckstart,ckend]=this.chunkRange(ckid);
        const str=this.offtext.slice(ckstart,ckend);
        const cklines=str.split('\n');
        let p=ckstart||0;
        let lineoff=0,choff=0;
        for (let i=0;i<cklines.length;i++) {
            if (p+cklines[i].length>=start) {
                //從 ckline 起算的 距離(real ch offset)
                choff=start-p;
                break;
            }
            lineoff++;
            p+=cklines[i].length+1;
        }
        return [ckid,lineoff,choff]
    }
    chunkRange(ck){
        const at=this.chunks.indexOf(ck);
        if (at==-1) return [0,0];
        return [this.chunkpos[at], this.chunkpos[at+1]];
    }
    pbRange(pb){
        if (typeof pb=='number') pb=pb.toString();
        const at=this.pbs.indexOf(pb);
        if (at==-1) return [0,0];
        return [this.pbpos[at] , this.pbpos[at+1] ];
    }
    async load(bkfolio) {
        const ptk=this.ptk;
        let bk='',folio=bkfolio; 
        if (bkfolio.match(/\d$/)) {
            bk=bkfolio.replace(/\d+$/g,'');
        } else {
            folio='';
            bk=bkfolio;
        }
        const addr=(bk?("bk#"+bk):'')+ (folio?'.':'')+(folio?('folio#'+folio):'');//+(pb?".pb#"+pb:'');
        const [from,to]=ptk.rangeOfAddress( addr);
        if (from==to) return ['',from,to];
        await ptk.loadLines([from,to])
        
        this.folio=folio;
        this.offtext=ptk.slice(from,to).join('\n'); 
        this.from=from;
        this.to=to;
        let p=0;
        
        while (p<this.offtext.length) {
            
            const ch3=this.offtext.slice(p,p+3)
            if (ch3=='^pb') {
                this.pbpos.push(p);
                p+=3;
                const m=this.offtext.slice(p).match(/([\d]+)/);
                this.pbs.push(m[1]);
                p+=m[1].length;
                
            } else if (ch3=='^ck') {
                this.chunkpos.push(p);
                p+=3;
                if (this.offtext.charAt(p)=='#') p++
                const m=this.offtext.slice(p).match(/([a-z\d]+)/);
                this.chunks.push(m[1]);
                p+=m[1].length;
                
            }
            p++;
        }
        this.pbpos.push(this.offtext.length-1);
        this.chunkpos.push(this.offtext.length-1);
    }
} 



export const extractPuncPos=(foliopagetext,foliolines=5,validpuncs=VALIDPUNCS)=>{
    const puncs=[];
    for (let i=0;i<foliopagetext.length;i++) {
        let ch=0,ntag=0,textsum=0;
        let [text,tags]=parseOfftext(foliopagetext[i]);
        const isgatha=!!tags.filter(it=>it.name=='gatha').length;
        if (i>=foliolines) break;
        if (isgatha) {text=text.replace(/．/g,'　')}; //replace punc inside gatha to ． 
        const chars=splitUTF32Char(text);
        for (let j=0;j<chars.length;j++) {
            while (ntag<tags.length&&textsum>tags[ntag].choff) {
                if (tags[ntag].name=='ck') {
                    puncs.push({line:i,ch, text: styledNumber(parseInt(tags[ntag].attrs.id),'①') });
                } else if (tags[ntag].name=='n') {//sutta number
                    puncs.push({line:i,ch, text: 'n'+parseInt(tags[ntag].attrs.id) });
                }
                ntag++;
            }

            textsum+=chars[j].length;
            if (~validpuncs.indexOf(chars[j])) {
                let text=toVerticalPunc(chars[j]);
                puncs.push({line:i,ch, text });
            }

            const r=CJKRangeName(chars[j]);
            if (r|| chars[j]=='　') {
                ch++;
            }

        }
    }
    return puncs;
}
