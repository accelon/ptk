import {removeBracket} from '../utils/cjk.ts'
import {CJKWordBegin_Reg} from '../fts/constants.ts'
import { parsePageBookLine } from "../offtext/parser.ts";
import {toSim} from 'lossless-simplified-chinese';
import { LEMMA_DELIMITER, StringArray } from '../utils/stringarray.ts';
import { unpackIntDelta } from '../utils/unpackintarray.ts';
import {columnTextByKey,keyOfEntry,entriesOfKey} from '../basket/entries.ts'
function backLinksOf(bk:string,line:number){
    const BK=this.LocalBackLinks[bk];
    if (!BK) return [];
    return BK[line]||[];
}
function backTransclusionOf(entry:string){
    const ptk=this;
    if (!ptk.backtransclusions) return [];
    const key=ptk.keyOfEntry(entry);
    const items=ptk.backtransclusions[key]||[];
    return items.map(it=>entriesOfKey(ptk,it,true)).filter(it=>!!it);
}
function guessBookId(t:string){
    t=removeBracket(t);
    const m=t.match(CJKWordBegin_Reg);
    if (m) {
        return this.BookIdByName[m[1]];
    }
}
const buildBookNames=(ptk:any)=>{
    for (let i=0;i<ptk.defines.bk?.linepos.length;i++) {
        const id=ptk.defines.bk.fields.id.values[i];
        const t=ptk.defines.bk.getInnertext(i);
        if (!t)continue;
        ptk.BookIdByName[t]= id;
        ptk.BookIdByName[toSim(t)]= id;
        ptk.BookNameById[id]=t;
    }
}
function bookNameById(id:string){
    const tag=this.getTagById('bk',id);
    return this.defines.bk.getInnertext(tag?.at);
}
const findEntryByDk=(ptk,dkid,bk)=>{
    const cols=Object.keys(ptk.columns);
    if (bk && ptk.columns[bk]) {
        const at=ptk.columns[bk].dkat.indexOf(parseInt(dkid));
        if (~at) return ptk.columns[bk].keys.get(at);
    } else {
        for (let col in ptk.columns) {
            const at=ptk.columns[col].dkat.indexOf(dkat);
            if (~at) return ptk.columns[col].keys.get(at);
        }    
    }
    return '';
}


function buildBackTransclusions(ptk){
    const section=ptk.getSection('_backtransclusions');
    if (!section.length) return {};
    const out={};
    const keys=new StringArray(section.shift(),{sep:LEMMA_DELIMITER});
    const dk=ptk.defines.dk;
    if (!dk) return out;
    for (let i=0;i<keys.len();i++) {
        //if (keys.get(i)=='阿育王') debugger
        const linepos=unpackIntDelta(section.shift());
        //convert linepos to entry
        const entries=[];
        for (let j=0;j<linepos.length;j++) {
            const dkat=dk.linepos.indexOf(linepos[j]);
            if (~dkat){
                const bk=ptk.nearestTag(linepos[j],'bk','id')
                const dkid=dk.fields.id.values[dkat];
                const e=findEntryByDk(ptk,dkid,bk);
                if (e) entries.push(e);
            }
        }
        //resolve the key from entry, which is not determine at compile time
        const [content,objarr]=columnTextByKey(ptk,keys.get(i));
        const key=objarr[0].key;
        if (!out[key])out[key]=entries;
        else {
            out[key].concat(entries);
            out[key].sort();
        }
    }
    return out;
}
function buildLocalBacklinks(ptk){
    const X=ptk.defines.x;
    const Y=ptk.defines.y;
    const L={};
    if (!X||!Y) return ;
    const XID=X.fields.id.values;
    const Xlinepos=ptk.defines.x.linepos;
    for (let i=0;i<XID.length;i++) {
        let [page,book,line]=parsePageBookLine(XID[i]);
        if (!book) {
            const innertext=X.getInnertext(i);
            book=guessBookId.call(ptk,innertext);
        }
        const sbook=ptk.nearestTag(Xlinepos[i],'bk','id');
        if (!book) book=sbook;
        const addr='bk#'+book+'.y#'+page;
        const [s,e]=ptk.rangeOfAddress(addr);
        //console.log(page,book,line,addr,s,e);
        if (!L[book]) L[book]={};
        if (!L[book][s+line]) L[book][s+line]=[];
        L[book][s+line].push(Xlinepos[i]);
    }
    return L;
}

export const enableBacklinkFeature=(ptk)=>{
    ptk.BookIdByName={};
    ptk.BookNameById={};
    ptk.guessBookId=guessBookId;
    ptk.bookNameById=bookNameById;
    //initial build
    ptk.backLinksOf=backLinksOf;
    ptk.backTransclusionOf=backTransclusionOf;
    ptk.keyOfEntry=keyOfEntry;
    buildBookNames(ptk);
    ptk.LocalBackLinks=buildLocalBacklinks(ptk);
    ptk.backtransclusions=buildBackTransclusions(ptk);
}