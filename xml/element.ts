export interface IElement {
    name:string,
    children:Array,
    parent:IElement,
    attrs:Map<string,string>,
}
export class Element implements IElement{
    constructor(name:string, attrs:Map) {
      this.name = name;
      this.parent = null;
      this.children = [];
      this.attrs = {};
      this.setAttrs(attrs);
    }
    setAttrs(attrs:string|Map) {
        if (typeof attrs === "string") {
          this.attrs.xmlns = attrs;
        } else if (attrs) {
          Object.assign(this.attrs, attrs);
        }
    }
    c(name:string, attrs:Map) {
        return this.cnode(new Element(name, attrs));
    }
    cnode(child) {
        this.children.push(child);
        if (typeof child === "object") {
          child.parent = this;
        }
        return child;
    }
    t(text:string) {
        this.children.push(text);
        return this;
    }
    innerText(trim=false) {
        const out=[];
        for (let i=0;i<this.children.length;i++) {
            if (typeof this.children[i]==='string') {
                const t=this.children[i];
                out.push(trim?t.trim():t);
            } else {
                const t=this.children[i].innerText(trim);
                out.push(trim?t.trim():t);
            }
        }
        return out.join('');
    }
}
