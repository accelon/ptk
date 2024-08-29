import {removeBracket} from '../utils/cjk.ts'
import {CJKWordBegin_Reg} from '../fts/constants.ts'
import { parsePageBookLine } from "../offtext/parser.ts";
import {toSim} from 'lossless-simplified-chinese';
function backlinksOf(bk:string,line:number){
    const BK=this.LocalBackLinks[bk];
    if (!BK) return [];
    return BK[line]||[];
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
        ptk.BookIdByName[t]= id;
        ptk.BookIdByName[toSim(t)]= id;
        ptk.BookNameById[id]=t;
    }
}
function bookNameById(id:string){
    const tag=this.getTagById('bk',id);
    return this.defines.bk.getInnertext(tag?.at);
}
function buildLocalBacklinks(){
    const X=this.defines.x;
    const Y=this.defines.y;
    const L=this.LocalBackLinks;
    if (!X||!Y) return ;
    const XID=X.fields.id.values;
    const Xlinepos=this.defines.x.linepos;
    for (let i=0;i<XID.length;i++) {
        let [page,book,line]=parsePageBookLine(XID[i]);
        if (!book) {
            const innertext=X.getInnertext(i);
            book=guessBookId.call(this,innertext);
        }
        const sbook=this.nearestTag(Xlinepos[i],'bk','id');
        if (!book) book=sbook;
        const addr='bk#'+book+'.y#'+page;
        const [s,e]=this.rangeOfAddress(addr);
        //console.log(page,book,line,addr,s,e);
        if (!L[book]) L[book]={};
        if (!L[book][s+line]) L[book][s+line]=[];
        L[book][s+line].push(Xlinepos[i]);
    }
}
export const enableBacklinkFeature=(ptk)=>{
    ptk.LocalBackLinks={};
    ptk.BookIdByName={};
    ptk.BookNameById={};
    ptk.buildLocalBacklinks=buildLocalBacklinks;
    ptk.guessBookId=guessBookId;
    ptk.bookNameById=bookNameById;
    //initial build
    ptk.backlinksOf=backlinksOf;
    buildBookNames(ptk);
    ptk.buildLocalBacklinks();
}