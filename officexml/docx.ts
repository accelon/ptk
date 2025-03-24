import { getRels } from './rels.js'; //slink id
import {  xpath,DOMFromString } from '../xml/index.js';
import { dumppara } from './para.js'; //process docx para


export const processDocument=(data,ctx)=>{
    const dom=DOMFromString(data);
    const out=[];
    const body=xpath(dom,'w:body');

    if (!body) {
        console.log('no body',ctx.fn)
        return;
    }
    for (let i=0;i<body.children.length;i++) {
        if(body.children[i].name=='w:p') {
            const para=dumppara(body.children[i],ctx);
            if (para) {
                out.push(para);
            }
        }    
    }
    return out;
}
export const processRels=(data,ctx)=>{
    const dom=DOMFromString(data);
    return getRels(dom.children,ctx);
}