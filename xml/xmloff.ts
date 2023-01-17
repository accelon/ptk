import {DOMFromString,walkDOM} from './dom.ts'
import {gini,fromObj} from '../utils/sortedarray.ts';
import {toBase26} from '../utils/base26.ts'
import {pinPos} from '../align/pinpos.ts';
export const parseTEI=(content:string)=>{
    let offset=0,txt='',tagcount=0, pinoffset=0,pinid='';
    let pboffset=0,pbid='*',pbpincount=0;
    const tree=DOMFromString(content);
    const ctx={};
    const tags=[], pinlengths=[];
    const pinstarts={'':0};
    const onOpen={
        '*':function(el){
            if (!el.name) return ;
            if (el.name=='pb') {
                pbid=el.attrs.id || el.attrs.n;
                pboffset=offset;
                pbpincount=0;
                pinid = pbid ;
                pinstarts[pinid]=offset;
            }
            if (el.name==pintag) {
                pinlengths.push(offset-pinoffset);
                pinoffset=offset;
                pbpincount++;
                pinid = pbid + (pbpincount?toBase26(pbpincount-1):'') ;
                pinstarts[pinid]=offset;
            }
            el.count= ++tagcount;
            let attrs=JSON.stringify(el.attrs)
            if (attrs=='{}') attrs='';
            tags.push([el.count, pinid, offset-pinstarts[pinid], el.name, attrs]);
        }
    }
    const onClose={
        '*':function(el){
            if (el.name) tags.push([-el.count,pinid,offset-pinstarts[pinid]]);
        }
    }
    const onText=(t)=>{
        txt+=t;
        offset+=t.length;
    }
    walkDOM(tree,ctx,onOpen,onClose,onText);

    for (let i=0;i<tags.length;i++) {
        const [idx,pinid,offset ] = tags[i];
        const starts=pinstarts[pinid];
        let pin=pinPos( txt.slice(starts) , offset, {backward:idx<0,cjk:true});
        if (!pin && idx>0) pinPos( txt.slice(starts) , offset, {backward:true,cjk:true});
        tags[i][2]=pin;
    }

    pinlengths.sort((a,b)=>a-b); //last pin is ignored
    const stat={
        PinTag:pintag,
        MinPinLen: Math.min(...pinlengths),
        MaxPinLen: Math.max(...pinlengths),
        AvgPinLen: parseFloat((offset /pinlengths.length).toFixed(3)), 
        PinCount:pinlengths.length,
        Gini: parseFloat(gini(pinlengths).toFixed(3))
    }
    
    return [txt,tags,stat];
}
export const parseXML=(content:string,ctx={})=>{
    let offset=0,txt='',tagcount=0;
    const tree=DOMFromString(content);
    const tags=[];
    const ele=ctx.ele||{};
    const nested=ctx.nested||[];
    const onOpen={
        '*':function(el){
            if (!el.name) return ;
            el.count= ++tagcount;
            let attrs=JSON.stringify(el.attrs)
            if (attrs=='{}') attrs='';
            if (!ele[el.name]) ele[el.name]={count:0} ;
            ele[el.name].count++;
            if (el.parent) {
                if (!ele[el.parent.name].child) ele[el.parent.name].child={};
                if (!ele[el.parent.name].child[el.name]) ele[el.parent.name].child[el.name]=0;
                ele[el.parent.name].child[el.name]++;
                if (el.parent.name==el.name) {
                    nested.push([ el.count,el.name,attrs,ctx.fn ]);
                }
            }
            
            tags.push([el.count, offset, el.name, attrs]);
        }
    }
    const onClose={
        '*':function(el){
            if (el.name) tags.push([-el.count,offset]);
        }
    }
    const onText=(t)=>{
        txt+=t;
        offset+=t.length;
    }
    walkDOM(tree,ctx,onOpen,onClose,onText);

    return [txt,tags];
}
