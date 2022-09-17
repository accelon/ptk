import {IElement, Element} from './element.ts'
import {Sax} from './sax.ts'
export interface DOMContext {
    delete:boolean,
    hide:boolean,
    onText:Function,
    compact:boolean,
    started:boolean,
    snippet:string
}
export const DOMFromString=(str,debug)=>{
    let tree;
    let el;
    const startElement=(name,attrs)=>{
        const child = new Element(name, attrs);
        el = !el ? child : el.cnode(child);
    }
    const endElement=name=>{
        if (name === el.name) {
            if (el.parent) {
              el = el.parent;
            } else if (!tree) {
              tree = el;
              el = undefined;
            }
        }
    }
    const onText=text=>{
        if (el) el.t(text);
    }
    const sax=new Sax({startElement,endElement,onText});

    sax.write(str);
    return tree;
}
export function JSONify(el) {
    if (typeof el !== "object") return el;
    return {
      name: el.name,
      attrs: el.attrs,
      children: el.children.map(JSONify),
    };
}
export const xpath=(root,p)=>{
    const paths=p.split('/');
    if (!root.children) return null;
    let found,el,children=root.children;
    for (let i=0;i<paths.length;i++) {
        for (let j=0;j<children.length;j++) {
            found=false;
            if (children[j].name===paths[i]) {
                el=children[j];
                children=children[j].children;
                found=true;
                break;
            }
        }
        if (!found) return null;
    }
    return el;
}
export const walkDOM=(el,ctx,onOpen={},onClose={},onText=null)=>{
    onText=onText||ctx.onText;
    if (typeof el==='string') return onText?onText(el,ctx):el;
    let out='';
    const openhandler= onOpen[el.name] || onOpen["*"];
    if (openhandler) {
        const out2 = openhandler(el,ctx);
        if (typeof out2=='string') out=out2;
    }
    if (el.children && el.children.length) {
        out+=el.children.map(e=>walkDOM(e,ctx,onOpen,onClose,onText)).join('');
    }
    const closehandler= onClose[el.name] || onClose["*"];
    if (closehandler) out+=closehandler(el,ctx)||'';    
    return out;
}
export const onOfftext=(el:IElement,ctx:DOMContext,onText)=>{
    onText=onText||ctx.onText;
    let s=el;
    // if (teictx.trimRight) s=s.trimRight();
    if (ctx.hide || ctx.delete) { 
        ctx.delete=false;
        return '';
    }
    if (ctx.compact && s.charCodeAt(0)<0x7f) { // a compact offtag is emitted just now
        s=' '+s;                               // use blank to separate tag ]
        ctx.compact=false;
    }
    if (s) ctx.snippet=s;
    if (onText) {
        return onText(el,ctx,ctx.started?s:'');
    } else {
        return ctx.started?s:'';
    }
}
export const walkDOMOfftext = (el:IElement,ctx:DOMContext,onOpen={},onClose={}) =>{
    /* helper for emiting offtext format*/
    return walkDOM(el,ctx,onOpen,onClose, onOfftext );
}