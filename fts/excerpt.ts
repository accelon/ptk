import {plTrim,plContain} from '../fts/posting.ts';
import {MAXPHRASELEN} from '../fts/constants.ts';
import {fromObj,bsearchNumber} from '../utils/index.ts';
export const listExcerpts=async (ptk,tofind,opts={})=>{
    const tlp=ptk.inverted.tokenlinepos;
    let sectionfrom=0,sectionto=0;
    if (opts.range) {
        const [first,last]=ptk.rangeOfAddress(opts.range);
        sectionfrom=tlp[first];
        sectionto=tlp[last];
    } else {
        sectionfrom=tlp[0];
        sectionto=tlp[ptk.header.eot];
    }

    const [phrases,postings]=await ptk.parseQuery(tofind,{tosim:ptk.attributes.lang=='zh'});
    let chunkobj={}, lineobj={},hitcount=0;
    const chunklinepos=(ptk.defines.ck||ptk.defines.dk).linepos;
    for (let i=0;i<postings.length;i++) {
        const pl=plTrim(postings[i], sectionfrom,sectionto);
        const [pllines,lineshits]=plContain(pl,ptk.inverted.tokenlinepos,true);
        const phraselen=phrases[i].length;
        hitcount+=pl.length;
        for (let j=0;j<pllines.length;j++) {
            const line=pllines[j];
            let removed=false;
            if (opts.includelines) {
                const at=bsearchNumber(opts.includelines,line);
                if (opts.includelines[at]!==line)  removed=true;
            }
            if (opts.excludelines) {
                const at=bsearchNumber(opts.excludelines,line);
                if (opts.excludelines[at]==line)  removed=true;
            }

            if (removed) continue;
            if (!lineobj[line]) lineobj[line]=[];
            lineobj[line].push( ...lineshits[j].map(it=>it*MAXPHRASELEN + phraselen)  );
            
            const at=bsearchNumber(chunklinepos, line)-1;
            if (!chunkobj[at]) {
                chunkobj[ at ]=0;
            }
            chunkobj[at]++;
        }
    }
    const lines=fromObj(lineobj,(a,b)=>[parseInt(a) , b.sort() ]).sort((a,b)=>a[0]-b[0]);
    const chunks=fromObj(chunkobj, (a,b)=>[a,b]).sort((a,b)=>b[1]-a[1]);
    return {lines,chunks,phrases,postings};
}

