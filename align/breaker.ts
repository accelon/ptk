import {OFFTAG_REGEX_G} from "../offtext/constants.ts"
import { diffChars, diffWords } from "diff";
import { posPin } from "./pinpos.ts";
export const spacify=str=>{ //remove all offtext and non ascii character, for more precise diff
    return str.replace(OFFTAG_REGEX_G,(m,tagname,attr)=>{
        return " ".repeat(tagname.length+(attr?attr.length:0)+1)
    }).replace(/[^a-zA-Z\u3400-\u9FFF\uD800-\uDFFF]/g,' '); //“‘ include ?
}
export const removeHeader=str=>{
    return str.replace(/^(.+)(\^n[\-\d]+)/,(m,rm,n)=>" ".repeat(rm.length)+n)
        .replace(/(\([^\)]+\))/g,(m,m1)=>" ".repeat(m1.length))
        .replace(/^sz/g,'   ').replace(/^\^n/g,'  ')
}
export const removeBold=str=>{
    return str.replace(/\^b([^\]]+?)\]/g,"  $1 ");
}
export const breakLine=(str,breaker)=>{
    const substrings=[],breakpos=[];
    let prev=0;
    str.replace(breaker,(m,m1,idx)=>{
        if (prev) breakpos.push(prev);
        substrings.push( str.substring(prev,idx+m1.length) );
        prev=idx+m1.length;
    })
    if (prev<str.length) {
        if (prev) breakpos.push(prev);
        substrings.push(str.substr(prev))
    }
    return {substrings,breakpos};
}
export const moveFootnoteToTail=str=>str.replace(/\n( *\^f\d+ *)/g,"$1\n");

export const autoENBreak=line=>{
    line=line.replace(/([^\dA-Z])([:\!\?\.”]+[:\!\?\.”’〕\)]* ?)/g,(m,alpha,m1)=>alpha+m1+'\n')
               .replace(/([^\dA-Z])([:\?\.”〕\)]+)(\^f\d+)/g,(m,alpha,m1,m2)=>alpha+m1+m2+'\n')
    
    line=moveFootnoteToTail(line);
    line=line.replace(/\n\]/g,']\n');
    return line.split('\n');
}
export const autoBreak=(lines,breaker="([?!।॥;–—] +)")=>{
    if (typeof lines==='string') lines=[lines];
    const sentences=[], breakpos=[];
    if (typeof breaker==='string') {
        breaker=new RegExp(breaker,"g");
    }
    for (let i=0;i<lines.length;i++) {
        const res=breakLine(lines[i],breaker);
        sentences.push(...res.substrings);
        breakpos.push(res.breakpos)
    }
    return {sentences,breakpos};
}
export const paragraphSimilarity=(p1,p2)=>{
    const P1=p1.map(l=>l.replace(/ +/g,'').trim()).filter(it=>!!it);
    const P2=p2.map(l=>l.replace(/ +/g,'').trim()).filter(it=>!!it);
    const p1len=P1.reduce( (p,v)=> p+v.length ,0);
    const p2len=P2.reduce( (p,v)=> p+v.length ,0);
    
    const ratio1=P1.map( l=> l.length/p1len||0);
    const ratio2=P2.map( l=> l.length/p2len||0);
    const accdiff=P1.reduce((p,v,i)=> p+=Math.abs(ratio1[i]-ratio2[i])||0,0);
    return accdiff;
}
export const breakSentence=(arr,breakpos,paraprefix='')=>{
    const out=[];
    for (let i=0;i<breakpos.length;i++) {
        const str=arr[i];
        let prev=0;
        let prefix=paraprefix;
        for (let j=0;j<breakpos[i].length;j++) {
            let bp=breakpos[i][j];
            let sub=str.substring(prev,bp);
            out.push( (i?prefix:'')+sub);
            prev=bp;
            prefix='';
        }
        if(prev<str.length-1) {
            out.push( str.substr(prev));
        }
    }
    return out;
}
const SENTENCESEP=String.fromCodePoint(0x2fff);
const SENTENCESEP1=String.fromCodePoint(0x2ffe);
export const diffBreak=(p1,p2,id,marker='<>')=>{//p1 cs(larger unit), p2(smaller unit,guiding text)
    let out='';
    const s1=p1.join(SENTENCESEP1), s2=p2.join(SENTENCESEP);
    const D=diffChars(s1,s2);
    for (let i=0;i<D.length;i++) {
        const d=D[i];
        let at=d.value.indexOf(SENTENCESEP);
        while (at>-1) {
            out+='\n';
            at=d.value.indexOf(SENTENCESEP,at+1);
        }
        if ( (!d.added && !d.removed) || d.removed) out+=d.value;
    }
    
    out=out.replace(/\n( *)\u2ffe/g,'$1\n'+marker) //確定p1換行符在行首
           .replace(/\u2ffe([ “‘]*)\n/g,'\n'+marker+'$1');
    if (out.indexOf(SENTENCESEP1)>0) {
        out=out.replace(/\u2ffe/g,'\n'+marker);//deal with leadch in the middle
    }
    //convert to breakpos
    const breaklines=out.split('\n'), breakpos=[];
    let linepos=[],offset=0, 
        ln=0; //line index of original text
    const regmarker=new RegExp(marker,"g");
    for (let i=0;i<breaklines.length;i++) {
        if (breaklines[i].substring(0,marker.length)===marker) {
            breakpos.push(linepos);
            offset=0;
            ln++;
            linepos=[];
        }
        let len=breaklines[i].replace(regmarker,'').length;
        if (offset>0) linepos.push(offset+ (p1[ln][offset-1]===' '?-1:0) ); //' \n' to '\n '
        offset+=len;
    }
    breakpos.push(linepos);

    while (p1.length>breakpos.length) breakpos.push([]);//make sure breakpos has same length
    return breakpos;
}

//ensure array length
export const ensureArrayLength=(arr,length,marker='<>')=>{
    if (length>arr.length) {
        while (length>arr.length) {
            arr.push(marker);
        }
    } else if (length<arr.length) {
        while (arr.length && length<arr.length) {
            const last=arr.pop();
            arr[arr.length-1]+=marker+last;
        }
    }
    return arr;
}
/* make sure cluster has ^n*/
export const ensureChunkHasPN=lines=>{
    let join='';
    const out=[];
    for (let i=0;i<lines.length;i++) {
        let t=lines[i];
        if (t.indexOf('^n')==-1) {
            join+=t;
        } else {
            if (join) console.log(join.length,join.substr(0,29))
            out.push(join+t);
            join='';
        }
    }
    return out;
}
//find out shorted lead to reach pos
const MAXWIDTH=5;
const shortestLead= (line,pos,from)=>{
    let lead,at,width=2;//try from 2 chars, up to MAXWIDTH
    while (at!==pos) {
        lead=line.substr(pos,width);
        at=line.indexOf(lead,from);
        if (at==-1) {
            throw "cannot find lead at "+pos+'lead '+lead;
        }
        if (at===pos) return lead;
        const ch=line.charAt(pos+width);
        if (width>MAXWIDTH || ch===',' || ch==='^') { //try occur
            let occur=0;
            while (at!==pos) {
                at=line.indexOf(lead,at+1);
                occur++;
            }
            lead+='+'+occur;
            break;
        } else {
            width++;
        }
    }
    return lead;
}
/* convert sentence break of a paragraph to hooks, output one line per paragraph , separated by tab */
export const hookFromParaLines=paralines=>{
    let bp=[],breakpos=[],out=[];
    let p=0;
    for (let i=0;i<paralines.length;i++) {
        const l=paralines[i];
        if (l.substr(0,3)==='^n ') {
            breakpos.push(bp);
            bp=[];
            p=0;
        } else {
            if (p) bp.push(p);
        }
        p+=l.length;
    }
    breakpos.push(bp);
    const orilines=paralines.join('').replace(/\^n /g,'\n^n ').split('\n');

    for (let i=0;i<orilines.length;i++) {
        let from=0,leads=[];
        for (let j=0;j<breakpos[i].length;j++) {
            const leadword=shortestLead(orilines[i],breakpos[i][j], from );
            from=breakpos[i][j]+1;
            leads.push(leadword);
        }
        out.push(leads)
    }
    return out;
}
export const breakByPin=(line,pins,id)=>{ //break a line by hook
    let prev=0,out=[],extrabr=0;
    for (let i=0;i<pins.length;i++){
        let pos=0,pin=pins[i];
        if (!pin) { //just insert a blank line
            extrabr++;
            continue;
        }
        pos=posPin(line,pin);
        if (pos==-1) {
            console.log('pin error',id,'pin',pin,'\nline',line);
            pos=prev;
        }
        out.push(line.substring(prev,pos));
        while (extrabr>0) {
            extrabr--;
            out.push('');
        }
        if (pos<prev) {
            console.log('id',id,
            '\npin',pin,'pos',pos,'text',line.substring(pos,pos+10),
            '\nprev',prev,'text',line.substring(prev,prev+10),
            '\npins',pins)

            throw "pin pos not in order"
        }
        prev=pos;
    }
    out.push(line.substring(prev));

    if (pins.filter(it=>!!it)==0) extrabr--; //無釘文的情況，每個tab算一個空行，而不是釘文分隔符的語意(因pins數=tab數+1)
    while (extrabr>0) {
        extrabr--;
        out.push('');
    }
    return out;
}
//remove the sentence break of a paragraph lines (sub paragraph starts with ^n )
export const removeSentenceBreak=paralines=>{
    const combined=paralines.join('').replace(/\^n /g,"\n^n ").split('\n')
    return combined;
}
//make sure each lines is paranum
export const removeSubPara=paralines=>{
    let joined='';
    const out=[];
    for (let i=0;i<paralines.length;i++) {
        if (paralines[i].match(/\^n[\d\-]+/)) {
            if (joined && joined.match(/\^n[\-\d]+/)) {
                out.push(joined);
                joined='';
            }
        }
        joined+=paralines[i];
    }
    if (joined) out.push(joined);
    return out;
}
export const autoEnglishBreak=line=>{// insert \n 
    return line.replace(/([^ ]{5})([\.\?\!”:\"\–]) ([‘“A-W\"])/g,"$1$2\n $3")
}
export const autoSanskritBreak=line=>{// insert \n 
    return line.replace(/(.{10})([\?\.\!”:\"\–\/\|]+) /g,"$1$2\n ")
}

export const autoChineseBreak=line=>{// insert \n
    return line.replace(/([！。？][』」”’〕]+)/g,"$1\n")
    .replace(/([^。？；：\d]{4,15})([？；：])/g,"$1$2\n")
    .replace(/([^。？；：\d]{6,})：([〔『「“‘])/g,"$1：\n$2")
    .replace(/([^。？；：\d]{5,15})……乃至……([^。？；：\d]{5,15})/g,"$1……乃至……\n$2")
    .replace(/([^。？；：\d]{5,15})，例如/g,"$1，\n例如")
    .replace(/(\u3400-\u9fff\ud800-\udfff) ([一二三四五六七八九十○]+)§/g,"$1\n $2§")
    .replace(/\n([”’』」〕）｝】》〉]+)/g,"$1")
    .replace(/([」』”’])([『「“‘])/g,"$1\n$2")
    // .replace(/([。！？』」〕]+)\n+/g,"$1\n")
    .replace(/\n([^a-zA-Z\d]{1,8}$)/,"$1")//太短的行
    .replace(/([？。])([^』」”’〕])/g,"$1\n$2")
    .replace(/([^ \d\n\]])(\^n\d)/g,"$1\n$2") //^n  一定在行首
    .replace(/\n+/g,"\n")
    .trimRight();
}
export const sentenceRatio=lines=>{
    if (typeof lines=='string') {
        lines=lines.split(/\r?\n/);
    }
    const total=lines.reduce( (p,v)=>p+v.length,0);
    const ratio=lines.map( v=> v.length/total);
    for (let i=1;i<ratio.length;i++) {
        ratio[i]+=ratio[i-1];
    }
    return ratio;
}
export const afterPN=str=>{
    const first2=str.substr(0,2);
    if (first2==='^n') {
        if (str.substr(0,3)==='^n ') return str.substr(3);
        else {
            const m=str.match(/^\n[\d\-]/);
            if (m) {
                return str.substr(m.length);
            }
        }
    }
    const m=str.match(/\^n([\d\-]+ ?)/);
    if (m) return str.substr(m.index+m[0].length);
    return str;
}
export const beforePN=str=>{
    const t=afterPN(str);
    return str.substr(0,str.length-t.length);
}
export const ensurefirstLineHasPN=str=>{
    let at=str.indexOf('^n');
    let remain=str.substr(at);
    let headers=str.substr(0,at).replace(/\n/g,'');
    if (headers&&headers.indexOf('^h')==-1&&headers.indexOf('^z')==-1) {
        headers='^h['+headers+']';
    }
    // console.log(at,headers,remain.substr(0,10));
    return headers+remain;
}



export const diffParanum=(para,gpara)=>{
    const GPN={},PN={};
    gpara.map(id=>{
        if (GPN[id]) console.log("guided repeated id "+id);
        GPN[id]=true;
    });
    para.map(id=>{
        if (PN[id]) console.log("repeated id "+id)
        PN[id]=true
    });
    const missing=gpara.filter(pn=>!PN[pn]);
    const extra=para.filter(pn=>!GPN[pn]);
    return {missing,extra};
}

export const guidedBreakLines=(buf,pins,fn='')=>{
    if (!pins) return buf;
    const lines=buf.split('\n');
    const out=[];
    let pn='';
    for (let i=0;i<lines.length&&i<pins.length;i++) {
        const m=lines[i].match(/\^n([\d\-]+)/);
        if (m) {
            pn=m[1];
        }
        const id=fn.replace('.xml','')+'.'+pn;
        if (!pins[i].length) {
            throw `empty pin entry of ${id}, #${i+1}`
        }
        const Pins=pins[i].split('\t');
        const pinpn=Pins.shift();
        if (m && pn!==pinpn && pinpn[0]!==':') {
            throw `pin paranum missmatch  ${pn} != ${pinpn}, #${i+1}`
        }
        const before=beforePN(lines[i]);
        let sentences=breakByPin(afterPN(lines[i]), Pins,id);
        sentences[0]=before+sentences[0]
        out.push( ...sentences  );
    }
    return out.join('\n');
}

export default {spacify,removeHeader,removeBold,removeSentenceBreak,autoENBreak,
    autoBreak,paragraphSimilarity,diffBreak,breakSentence,ensureArrayLength,ensureChunkHasPN,
    hookFromParaLines, breakByPin ,autoChineseBreak,removeSubPara,afterPN,beforePN,guidedBreakLines}