import {plAnd,plRanges,plCount} from './posting.ts';
import {fromSim} from 'lossless-simplified-chinese'
import {bsearchNumber} from '../utils/bsearch.ts'
import { plTrim } from './posting.ts';
import {unique, sortObj } from '../utils/sortedarray.ts';

export const TOFIND_MAXLEN=50;
export const MAX_PHRASE=5;

const scoreMatch=(matching,weights)=>{
    if (matching.length==0) return 0;
    let score=0,matchcount=0;

    for (let j=0;j<weights.length;j++) {
        if (matching[j]) {
            matchcount++;
            score+= weights[j] * (matching[j]>1?Math.sqrt(matching[j]):1); //出現一次以上，效用递減
        }
    }
    let boost=(matchcount/weights.length);
    boost*=boost;  // 有兩個詞，只有一個詞有hit ，那boost只有 0.25。
    return score*boost;
}
export function scoreLine(postings,chunklinepos,tlp){
    tlp=tlp||this.inverted.tokenlinepos, tlplast=tlp[tlp.length-1];
    chunklinepos=chunklinepos||this.defines.ck.linepos;
    const averagelinelen=tlplast/tlp.length;
    const allhits=postings.reduce((acc,i)=>i.length+acc ,0 );
    const weights=postings.map( pl=> Math.sqrt(allhits/pl.length) );
    let i=0,scoredLine=[];
    const ptr=new Array(postings.length);
    ptr.fill(0);
    let prev=0;
    while (i<tlp.length-1) { //sum up all Postings 
        let nearest=tlplast;
        const from=tlp[i], to=tlp[i+1];
        let matching=[];
        prev=0;
        for (let j=0;j<postings.length;j++) {
            const pl=postings[j];
            let v=pl[ptr[j]];

            while (v<from&&ptr[j]<pl.length) {
                ptr[j]++
                v=pl[ptr[j]];
            }
            while (v>=from&&v<to ) {
                if (!matching[j]) matching[j]=0;
                matching[j]++; //each hit has a base score 1

                if (j==0) prev=v;  // score closer token
                else {
                    const dist=v-prev-j;
                    if (dist==0) { //immediate prev token
                        matching[j] += 3;
                    } else {  
                        matching[j] += 1/dist;
                    }
                } 

                ptr[j]++;
                v=pl[ptr[j]];
            }            
            if (nearest>v) nearest=v;
        }

        const score=scoreMatch(matching,weights);
        //boost single phrase search with linelen, shorter line get higher score
        let shortpara = 10*(averagelinelen/(to-from+1)) ;  //short para get value > 1
        if (shortpara<10) shortpara=10;

        //出現次數相同，較短的段落優先
        const boost=Math.log(shortpara); //boost 不小於 1

        if (score>0) {
            const chunk=bsearchNumber(chunklinepos,i)-1;

            scoredLine.push([i+1,score*boost,chunk]);//y is 1 base
        }
        i++;
        while (nearest>tlp[i+1]) i++;
    }
    scoredLine=scoredLine.sort((a,b)=>b[1]-a[1]);
    return scoredLine;
}


export function phraseQuerySync(phrase:string,tokens=null){
    tokens=tokens||this.loadPostingsSync(phrase);
    if (!tokens) return [];
    phrase=phrase.trim();
    const qkey=this.name+'@'+phrase;
    let out=this.queryCache[qkey];
    if (out) return out;
    out=tokens[0];
    for (let i=1;i<tokens.length;i++) {
        let pl1=out;
        out=plAnd(pl1,tokens[i],i);
    }
    this.queryCache[qkey]=out||[];
    return this.queryCache[qkey];    
}

export async function phraseQuery(phrase:string){
    const tokens=await this.loadPostings(phrase);
    if (!tokens) return [];
    return phraseQuerySync.call(this,phrase,tokens);
}
export async function parseQuery(tofind:string,opts){
    opts=opts||{};
    const phrases=tofind.split(/[, 　]/);
    if (phrases.length>MAX_PHRASE) phrases.length=MAX_PHRASE;
    const outphrases=[], postings=[];
    for (let i=0;i<phrases.length;i++) {
        if (!phrases[i].trim()) continue;
        let posting=await phraseQuery.call(this,phrases[i]);
        if ((!posting || !posting.length) && this.attributes.lang=='zh') {
            posting=await phraseQuery.call(this,fromSim(phrases[i]));
        }
        if (opts.ranges && opts.ranges.length) {//only search in ranges
            posting=plRanges(posting,opts.ranges);
        }
        outphrases.push(phrases[i]);
        postings.push(posting||[]);
    }
    return [outphrases,postings];
}
export async function scanText(tofind:string,opts) {
    const ptk=this;
    const [phrases,postings]=await ptk.parseQuery(tofind,opts);
    if (!postings.length || !ptk.inverted) return [];
    const tagname=opts?.groupby||'ak'
    const groupby=ptk.defines[tagname];
    const tlp=[], TLP = ptk.inverted.tokenlinepos;
    if (groupby) { 
        for (let i=0;i<groupby.linepos.length;i++) {
            const nextstart=TLP[ groupby.linepos[i+1] ]||TLP[TLP.length-1] ;
            tlp.push([ TLP[ groupby.linepos[i]] , nextstart ]);
        }   
        const res=new Array(tlp.length);
        res.fill(0);
        
        for (let i=0;i<postings.length;i++) {
            const res1= plCount(postings[i], tlp);
            for (let j=0;j<tlp.length;j++) {
                res[j]+=res1[j];
            }
        }
        const out=res.map((count,idx)=>{
            const id=groupby.fields.id.values[idx];
            return {count, caption: groupby.getInnertext(idx), 
                scope:tagname+ (parseInt(id)?id:'#'+id) };
        });
        return out;
    } else {//no group, as a whole
        return [{count:postings.length,caption:'-', name:'-'}];
    }
}
export const validateTofind=(str:string)=>{
    return (str||'').replace(/[\[\]&%$#@\/\^]/g,'').trim();
}
export function hitsOfLine(line,allpostings){
    const tlp=this.inverted.tokenlinepos;
    const hits=[];
    for (let i=0;i<allpostings.length;i++) {
        const from=tlp[line-1], till=tlp[line];
        const hit=plTrim(allpostings[i], from,till).map(it=>it-from);
        hits.push(hit);
    }
    return hits;
}

const tofindInSentence=(sentence:string,pos=0,len=0)=>{
    if (pos==-1) {
        return [sentence];
    }
    let tofinds=Array<string>();
    if (len>0) {
        return [sentence.slice(pos,pos+len)];
    }
    if (sentence.length<4) tofinds.push(sentence)
    for (let i=pos;i<=sentence.length;i++) {
        let t=sentence.slice(pos,i);
        if (t.length>1) tofinds.push(t.trim());
        t=sentence.slice(pos-1,i);
        if (t.length>1) tofinds.push(t.trim());
        t=sentence.slice(pos+1,i);
        if (t.length>1) tofinds.push(t.trim());
        if (t.length>5) continue;
    }
    return unique(tofinds);
}
const statSentencePhrase=(tofinds:Array<string>,postings:Array<Array<number>>)=>{
    const out={};
    if (tofinds.length==0) {
        return []
    } else if (tofinds.length==1) {
        return [[tofinds[0],postings[0]]];
    }
    const total=postings.reduce((p,n,i)=>p+Math.log(tofinds[i].length* n.length),0);
    const avg=total/postings.length;
    for (let i=0;i<postings.length;i++) {
        if (Math.log(postings[i].length*tofinds[i].length)>avg &&postings[i].length>1) {
            out[tofinds[i]]=postings[i];
        }
    }
    if (!Object.keys(out).length) {
        for (let i=0;i<postings.length;i++) {
            out[tofinds[i]]=postings[i];
        }
    }
    //dedup 諸比  諸比丘, 衛國  , 舍衛國
    for (let key in out) {
        for (let shortkey in out) {
            if (key==shortkey || !out[shortkey].length) continue;
            if ((key.startsWith(shortkey)||key.endsWith(shortkey))&& 
                out[key].length*1.1>=out[shortkey].length ) {
                out[shortkey]=[];
            }
        }
    }
    for (let key in out) {
        if (out[key].length==0) delete out[key];
    }

    return sortObj(out,(a,b)=>b[1].length-a[1].length).slice(0,3);
}
export async function searchSentence(sentence:string,pos=0,len=0){
    const out=[];
    const tofinds=tofindInSentence(sentence.trim(),pos);
    for (let i=0;i<tofinds.length;i++) {
        const tf=tofinds[i];
        out.push(await phraseQuery.call(this,tf));
    }
    return statSentencePhrase(tofinds,out);
}
export function searchSentenceSync(sentence:string,pos=0,len=0){
    if (!sentence.trim()) return [];
    const tofinds=tofindInSentence(sentence,pos,len);
    const out=tofinds.map(it=>phraseQuerySync.call(this,it));   
    return statSentencePhrase(tofinds,out);
}

export default {phraseQuery,scanText,validateTofind,scoreLine,
    TOFIND_MAXLEN,hitsOfLine,searchSentence,searchSentenceSync};