
import {xpath} from '../xml/dom.ts';
export const createChunkId_cbeta=(arr)=>{
    const lb={}, p={};
    for (let i=0;i<arr.length;i++) {
        const [id,tag,caption]=arr[i];
        const insert=tag?(tag+(caption?'【'+caption+'】':'')):caption;
        if (id.length>11) { 
            p[id]=insert;
        } else { //無字元位址
            const at=id.indexOf('#');
            if (~at) {
                lb[id.slice(0,at)]=[insert,id.slice(at+1)]
            } else {
                lb[id]=insert;
            }
        }
    }
    return {lb,p};
}
export const insertTag_cbeta=(txt,tags,chunkidarr)=>{
    const chunkid=createChunkId_cbeta(chunkidarr); // 之後的經只要加入陣列元素
    let vol='',offset=0 ;
    let insertcount=0, inserttag='', insertoffset=0;
    const out=[];
    for (let i=0;i<tags.length;i++) {
        // 標記序號, 字元位址 , 名稱 , 屬性
        const [type, ntag, name,dist, _attrs]=tags[i];
        offset+=dist;
        if (inserttag && offset>=insertoffset) { //此時才可以加入
            out.push(['^', insertcount++,inserttag,  (dist - offset+insertoffset)]);
            out.push([type,ntag, name,offset-insertoffset,_attrs]);
            inserttag='';
        } else {
            out.push([type,ntag, name,dist,_attrs]);
        }
        if (name==='pb') {
            const attrs=JSON.parse(_attrs);
            vol=attrs['xml:id'].slice(0,3);
        } else if (name==='p' && _attrs) {
            const attrs=JSON.parse(_attrs);
            const id=attrs['xml:id']||'';            
            const _ckid=chunkid.p[id.slice(1)];
            if (_ckid) { //此處加入新tag
                inserttag=_ckid;
                insertoffset=offset;
            }
        } else if (name==='lb') {
            const attrs=JSON.parse(_attrs);
            const id=attrs.n;
            let _ckid=chunkid.lb[vol+'p'+id];
            if (_ckid) { 
                if (_ckid && Array.isArray(_ckid)) { //帶釘文
                    const pintext=_ckid[1];
                    const at=txt.indexOf(pintext, offset);
                    if (~at) {
                        inserttag=_ckid[0];
                        insertoffset=at;
                    } else {
                        console.error('查無此釘文',pintext);
                    }
                } else if (typeof _ckid=='string') { //文字型，在開頭
                    inserttag=_ckid;
                    insertoffset=offset;
                    const preveol=txt.charAt(offset-1);//上一行的結尾
                    if (preveol!=='。') { //用最後一個出現的。作為起點
                        const at=txt.indexOf('。',offset);
                        if (~at && at>offset && offset+19>at) {
                            insertoffset=at+1;
                        }                       
                    }
                }
            }
        }
    }
    return out;
}

export const offGen_cbeta=(txt,tags,charmaps)=>{
    const out=[];
    let offset=0,prevoff=0,started=false,hide=false;
    for (let i=0;i<tags.length;i++) {
        const [type, ntag, name,dist, _attrs]=tags[i];
        offset+=dist;        
        if (started) {
            const t=txt.slice(prevoff,offset);
            if (!hide) out.push(t);
            if (type=='^') {
                if (name.match(/^[a-z]/)) out.push('\n^ck#'+name+'\n');
                else out.push(name);//as it is
            }            
        }
        if (name=='body') {
            started=true;
        } else if ( (name=='p' || name=='l'|| name=='lg') && type=='+') {
            out.push('\n')
        } else if (name=='cb:docNumber' || name=='note') {
            hide=(type=='+');
        }
        
        prevoff=offset;
    }
    return out.join('')
        .replace(/\[cf[A-Za-z\d_]+\]/g,'')
        .replace(/\[mc_([A-Za-z\d_]+)\]/g,(m0,mc)=>{
            const m=charmaps[mc]
            if (!m) {
                console.log('cannot replace CBxxx',mc);
            }
            return m;
        })
        .replace(/([！。？][」])/g,"$1\n")
        .replace(/。([^』」])/g,"。\n$1")
        .replace(/([：；，])([一二三四五六七八九十])([，、])/g,"$1\n$2$3")
        .replace(/ *\n+/g,'\n').trim()
}

export const StockCharMap_cbeta={
    'CB01647':'︵𮒻至壬︶',
}
export const buildCharMap_cbeta=tree=>{
    const out=StockCharMap_cbeta;
    const charDecl=xpath(tree,'teiHeader/encodingDesc/charDecl');

    for (let i=0;i<charDecl?.children.length;i++) {
        const item=charDecl.children[i];
        if (item.name=='char') {
            const id=item.attrs['xml:id'];
            for (let j=0;j<item.children.length;j++){
                const m=item.children[j];
                if (m.name=='mapping' &&
                ( m.attrs?.type=="unicode"|| m.attrs?.type=='normal_unicode')) {
                    const code=parseInt('0x'+m.children[0].slice(2),16);
                    const c=String.fromCodePoint( code);
                    out[id]=c
                }
            }
        }      
    }
    return out;
}