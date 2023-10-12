import { removeSentenceBreak, sentenceRatio,diffParanum,autoENBreak } from './breaker.ts';
export const linePN=str=>str.match(/\^n([\d\.\-_]* ?)/)
export const toParagraphs=(L,opts={})=>{
    const out=[];
    let lines=[],pid='';
    const unbreak=opts.unbreak||false;
    const bkpf=(opts.bkid||'').replace(/\..+$/,'');

    for (let i=0;i<L.length;i++) {
        if (L[i].indexOf('^n')>-1 && L[i].substr(0,3)!=='^n ') {
            const id=L[i].match(/\^n([\d\-\.]+)/);
            if (!id) {
                console.log('no id',L[i],i)
            }
            if (pid) {
                out.push([pid,unbreak?removeSentenceBreak(lines):lines]);
                lines=[];        
            }
            pid=(bkpf?bkpf+'.':'')+id[1];
        }
        lines.push(L[i]);
    }
    out.push([pid,unbreak?removeSentenceBreak(lines):lines]);
    return out;
}
const fixLoneN=lines=>{
    const lonen=lines[0].match(/\^n([\d\-]+)$/);
    if (lonen){
        const n=lines.shift();
        lines[0]=n+lines[0];
    }
    
    return lines;
}
export const autoAlign=(f1,guide,fn)=>{
    //prerequisite
    //f1 and f2 need ^n marker
    //f2 has more lines than f1
    //for each paragraph, let f1 has same sentence as f2
    
    const gpara=toParagraphs(guide);
    const para=toParagraphs(f1);

    if (para.length!==gpara.length) {
        console.log(fn,'para.length unmatch,',para.length,'< guided',gpara.length);
        console.log(diffParanum(para.map(it=>it[0]),gpara.map(it=>it[0])));
        return f1;
    }
    const res=[];
    for (let i=0;i<gpara.length;i++) {
        const rgpara=sentenceRatio(gpara[i][1]);
        let rpara=sentenceRatio(para[i][1]);
        if (gpara[i][0]!==para[i][0]) {
            console.log('paranum diff',gpara[i][0],para[i][0])
        }
        const aligned=alignParagraph(rpara,rgpara,para[i][0]);
        if (rpara.length<rgpara.length) { //
            while (para[i][1].length<rgpara.length) {
                para[i][1].push(''); //inserted line
            }
            fixLoneN(para[i][1]);
            while (para[i][1].length<gpara[i][1].length) {
                para[i][1].push('');
            }

            res.push(...para[i][1] );
            continue;
        }

        for (let j=0;j<aligned.length;j++) {
            const t=(para[i][1][aligned[j]]||'')
            if (t) para[i][1][aligned[j]]='\n'+t;
        }
        const newpara=para[i][1].join('').split('\n');
        fixLoneN(newpara);

        while (newpara.length<gpara[i][1].length) {
            newpara.push('');
        }

        res.push(...newpara);
    }
    return res;
}

export const combineHeaders=str=>{
    let headers='',pncount=0;
    const lines=str.split('\n'), out=[];
    for (let i=0;i<lines.length;i++) {
        let l=lines[i]||'';
        if (linePN(l) ) {
            pncount++;
            out.push(headers+l);
            headers='';
        } else {
            const m=l.match(/\^[zh][\d\[]/);
            if (m || !pncount){
                if (!m) l='^h['+l+']' //add generic header
                headers+=l;
            } else {
                out.push(l);
            }
        }
    }
    //ensure each ^n\d has text followed
    let s=out.join('\n');
    // if (s=s.replace(/(\^n[\d\-]+)\n/g,'$1');
    // console.log(s.substr(0,1300))
    return s;
}

export const alignParagraph=(para , guide, id)=>{ //para must have more fregment
    if (para.length<guide.length)  return null;
    let i=0,prev=0,gi=0;
    const out=[];

    for (let gi=0;gi<guide.length;gi++) {
        while (i<para.length&&para[i]<guide[gi]) i++;
        if (out.length+1>=guide.length) break;
        if (i>prev) {
            out.push(i);
        }
        prev=i;
    }
    return out;
}
export const alignParagraphLinecount=(para, paralinecount, id)=>{
    let out=[];
    if (para[0].match(/\^n(\d+ ?)$/) && para.length>1)  para[0]= para.shift() + para[0];
    if (para.length==paralinecount) {
        return para;
    } if (para.length>paralinecount) {
        // console.warn( `has more line ${para.length} > ${paralinecount} ,id ${id}`)
        out.push(...para)
    } else if (para.length<paralinecount) {
        for (let i=0;i<para.length;i++) {
            const broken=autoENBreak(para[i]);
            // console.log(paralinecount,broken)
            out.push(... broken);
        }
    }
    out=out.filter(it=>!!it);
    
    while (out.length<paralinecount) {
        out.push('');
    }
    while (out.length>paralinecount) {
        const first=out.shift();
        out[0]=first+out[0];
    }
    if (out[0].match(/\^n(\d+ ?)$/) && out.length>1) {
        out[0]= out.shift() + out[0];
        out.push('');
    } 
    return out;
}

export default {combineHeaders,autoAlign,toParagraphs,alignParagraph,alignParagraphLinecount};