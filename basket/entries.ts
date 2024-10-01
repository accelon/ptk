import { parsePageBookLine, parseTransclusion, unitize } from "../offtext/parser.ts";
import { fromObj } from "../utils/sortedarray.ts";
export const buildYToc=(ptk,book)=>{
    const Y=ptk?.defines.y;

    if (!Y) return [];
    const ID=Y.fields.id;
    const out=[];
    const [from,to]=ptk.rangeOfAddress('bk#'+book)
    for (let i=0;i<ID.values.length;i++) {
        const linepos=Y.linepos[i]
        if (linepos<from || linepos>to) continue;
        const t=Y.getInnertext(i);
        if (t) {
            const caption='^y'+ID.values[i]+'《'+t+'》';
            const at=ptk.nearestTag( linepos+1,'dk');
            const page=parseInt(ptk.defines.dk.fields.id.values[at]);
            const line=linepos-ptk.defines.dk.linepos[at];
            out.push({caption,page,line})
        }
    }
    return out;
}

export const captionOf=(ptk,addr)=>{
    if (!addr) return '';
    const [p,b,l]=parsePageBookLine(addr);
    return captionOfPage(ptk,b,p,l);
}
export const captionOfPage=(ptk,bk,page,line=0,bookname=false)=>{
    if (!ptk) return '';
    const COL=ptk.columns[bk];
    let caption='';
    if (COL && parseInt(page).toString()==page) {
        const at=COL.dkat.indexOf(parseInt(page));
        caption=COL.keys.get(at)||'';
    } 
    if (!caption) {//try yid
        const [s,e]=ptk.rangeOfAddress('bk#'+bk+'.dk#'+page);
        let tagat=ptk.nearestTag(s+1+parseInt(line),'y');
        if (~tagat) {
            while (tagat>=0 && !caption) {
                caption=ptk.defines.y.getInnertext(tagat);
                tagat--;
            }
        }
    }
    return (bookname?(ptk.BookNameById[bk]+'．') :'')+caption;
}
export const pageBookLineOfAnchor=(anchor,ptk)=>{
    const [xyidline,book]=anchor.split('@');
    let [xyid,loff]=xyidline.split('.');
    loff=parseInt(loff)||0;
    const [bookstart]=ptk.rangeOfAddress('bk#'+book);
    const [s,e]=ptk.rangeOfAddress('bk#'+book+'.y#'+xyid.slice(1));
    let bookat=ptk.nearestTag(bookstart,"dk");
    if (bookat<0) bookat=0;
    const numberpage=ptk.nearestTag(s,"dk")-bookat;
    const lineoff=s-ptk.defines.dk.linepos[numberpage]+loff;
    return numberpage+'@'+book+ (lineoff?'.'+lineoff:'');
}

export const yidarrInRange=(ptk,s,e)=>{
    const [first,last]=ptk.tagInRange("y",s,e);
    const idarr=ptk.defines.y.fields.id.values;
    const linepos=ptk.defines.y.linepos;
    const out=[];
    for (let i=first;i<=last;i++) {
        out[linepos[i]-s]="y"+idarr[i];
    }
    let prev='',lineoff=0;
    for (let i=0;i<e-s;i++) {//
        if (out[i]) {
            prev=out[i];
            lineoff=0;
            
        } else if (prev) {
            lineoff++;
            out[i]=prev+'.'+lineoff;
        }
    }
    return out;
}

export const enumEntries=(ptk,fn,tofind,max=100)=>{
    const keys=ptk.columns[fn]?.keys;
    if (!keys) return []
    let tf=tofind,mode=SA_MATCH_ANY;
    if (tofind.startsWith('^')) {
        tf=tofind.slice(1);
        mode=SA_MATCH_START;
    } else if (tofind.endsWith('$')) {
        tf=tofind.slice(0,tofind.length-1);
        mode=SA_MATCH_END;
    } else if (tofind.startsWith('.') && tofind.endsWith('.')) {
        tf=tofind.slice(1,tofind.length-1);
        mode=SA_MATCH_MIDDLE;
    }
    if (!tf) {
        const atarr=keys.enumMode(tf,mode,max);
        return atarr.map(it=>keys.get(it));   
    } else {
        for (let i=0;i<max;i++) {
            const t=keys.get(i);
            if (!t) break;
            out.push(t)
        }
        return out;
    }
}
const getBookColumnText=(ptk,bk,key)=>{
    const col=ptk.columns[bk];
    if (!col||!col.keys) return [-1,''];
    const at=col.keys.indexOf(key);
    if (at==-1) return [-1,''];
    const dk=col.dkat[at];
    const [s,e]=ptk.rangeOfAddress('bk#'+bk+'.dk#'+dk);
    return [at,ptk.slice(s,e).join('\n'),bk];
}
export const getAnyColumnText=(ptk,book,key)=>{
    if (!key) return [-1,''];
    if (book) {
        return getBookColumnText(ptk,book,key);
    } else {
        let at,text;
        for (let bk of Object.keys(ptk.columns)) {
            [at,text]=getBookColumnText(ptk,bk,key);
            if (at>-1) return [at,text,bk];
        }
        return [-1,''];
    }
}
const TRANSCLUSION_INDIRECT_REGEX=/@(.+)$/
export const getColumnText=(ptk,bk,key)=>{
    let [at,content,book]=getAnyColumnText(ptk,bk,key);
    //book may overwrite bk if empty
    let m=content.match(TRANSCLUSION_INDIRECT_REGEX);
    while (m) {
        content='';
        key=m[1];
        if (m) {
            [at,content]=getAnyColumnText(ptk,bk,m[1]);
        } else break;
        m=content.match(/@([^ <>\[\]\{\}]+)$/);
    }
    return [content,[{key}],at,0];
}
export const columnTextByKey=(ptk,key,bk='')=>{
    return getColumnText(ptk,bk,key);
}

export const  pageFromPtk=(ptk,book,page)=>{
    const [s,e]=ptk.rangeOfAddress("bk#"+book+".dk#"+page);
    //assuming inmemory
    //await ptk.loadLines([s,e]);
    const lineinfo=[];    
    let yidarr=[];
    if (ptk.defines.y) {
        yidarr=yidarrInRange(ptk,s,e);
    }
    const lines=ptk.slice(s,e)
    const text=lines.join('\n');
    const locallinks=ptk.LocalBackLinks[book]||[]
    for (let i=0;i<e-s;i++) {
        lineinfo[i]={yid:yidarr[i], locallinks:locallinks[s+i] }
    }
    return [text,lineinfo,page,0]
}
export const getSliceText=(bk:string,pg:string,ptk,getPageText)=>{
        if (parseInt(pg).toString()==pg) {
        return ptk?pageFromPtk(ptk,bk,pg):getPageText(pg,bk);
    } else if (ptk) {
        if (pg.startsWith('x')||pg.startsWith('y')) {
            const [page,unused,line]=parsePageBookLine(pg);
            const [s,e]=ptk.rangeOfAddress('bk#'+bk+'.y#'+page.slice(1));
            const lines=ptk.slice(s,e);
            const yidarr=yidarrInRange(ptk,s,e);
            const numberpage=ptk.nearestTag(s,"dk");
            const lineoff=s-ptk.defines.dk.linepos[numberpage]
            const lineinfo=[];
            const book=ptk.nearestTag(s+1,'bk','id');
            const locallinks=ptk.LocalBackLinks[book]||[];
            for (let i=0;i<lines.length;i++) {
                lineinfo[i]={yid:yidarr[i],locallinks:locallinks[s+i]}
            }
            return [lines.join('\n'),lineinfo,numberpage, lineoff];
        } else {//fi
            return columnTextByKey(ptk,pg,bk)
        }
    }
    return ['',[],0,0]
}

export const brokenTransclusions=async (ptk,dictptk)=>{
    await ptk.loadAll();
    const notfound={};
    if (!dictptk) dictptk=ptk;

    for (let i=1;i<ptk.header.eot;i++){
        const line=ptk.getLine(i);
        const units=unitize(line);
        for (let j=0;j<units.length;j++) {
            const u=units[j];
            if (u.startsWith('^[')) {
                const [tag,innertext]=parseTransclusion(u);
                 const [t,obj]=columnTextByKey(dictptk,innertext);
                if (!t) {
                    const key=obj[0].key||innertext; //alias key
                    if (!notfound[key]) notfound[key]=0;
                    notfound[key]++;
                }
            }
        }
    }
    const notfoundarr=fromObj(notfound,true);
    if (notfoundarr.length) console.log(notfoundarr)
    return [];
}
//return term key given entry,  
export function keyOfEntry(entry:string){
    let [at,text]=getAnyColumnText(this,'',entry);
    let key=entry,m;
    while (m=text.match(TRANSCLUSION_INDIRECT_REGEX)) {
        key=m[1];
        [at,text]=getAnyColumnText(this,'',key);
    }
    return key;
}
export const entriesOfKey=(ptk,key,firstonly=false)=>{
    const out=[];
    for (let bk of Object.keys(ptk.columns)) {
        const col=ptk.columns[bk];
        if (!col.dkat)continue;
        for (let j=0;j<col.dkat.length;j++) {
            const [s,e]=ptk.rangeOfAddress("bk#"+bk+".dk#"+col.dkat[j]);
            const text=ptk.slice(s,e).join('\n');
            if (text.endsWith('@'+key)) {
                out.push( col.keys.get(j) );
            }
        }
    }
    return firstonly?(out[0]||''):out;
}