import {plAnd,plRanges,plCount} from './posting.ts';
import {fromSim} from 'lossless-simplified-chinese'
import {bsearchNumber} from '../utils/bsearch.js'
import { plTrim } from './posting.ts';
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

export async function phraseQuery(phrase:string){
    phrase=phrase.trim();
    const qkey=this.name+'@'+phrase;
    let out=this.queryCache[qkey];
    if (out) return out;
    const tokens=await this.loadPostings(phrase);

    if (!tokens) return [];
    out=tokens[0];
    for (let i=1;i<tokens.length;i++) {
        let pl1=out;
        out=plAnd(pl1,tokens[i],i);
    }
    this.queryCache[qkey]=out||[];
    return this.queryCache[qkey];
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
        const res= plCount(postings[0], tlp);
        const out=res.map((count,idx)=>{
            const id=groupby.fields.id.values[idx];
            return {count, caption: groupby.innertext.get(idx), 
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

export default {phraseQuery,scanText,validateTofind,scoreLine,TOFIND_MAXLEN,hitsOfLine};