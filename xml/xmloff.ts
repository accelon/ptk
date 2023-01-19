import {DOMFromString,walkDOM} from './dom.ts'

export const peelXML=(content:string,ctx={})=>{
    let offset=0,txt='', prevname='',prevoffset=0;
    const tree=DOMFromString(content);
    const tags=[];
    const elcount={};
    const ele=ctx.ele||{};
    const nested=ctx.nested||[];
    const onOpen={
        '*':function(el){
            if (!el.name) return ;
            if (!elcount[el.name]) elcount[el.name]=0;
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
            elcount[el.name]++;
            const count=elcount[el.name]?elcount[el.name]:'';
            tags.push(['+', count ,el.name, offset - prevoffset, attrs]);

            prevname=el.name;
            prevoffset=offset;
        }
    }
    const onClose={
        '*':function(el){
            if (!el.name) return;
            if (el.name==prevname && offset == prevoffset) { //null tag
                tags[tags.length-1][0]='';
            } else {
                const count=elcount[el.name]?elcount[el.name]:'';
                tags.push(['-',count,el.name,offset - prevoffset]);
            }             
            prevoffset=offset;
        }
    }
    const onText=(t)=>{
        txt+=t;
        offset+=t.length;
    }
    walkDOM(tree,ctx,onOpen,onClose,onText);

    return [txt,tags,tree];
}
