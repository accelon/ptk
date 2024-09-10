import { Paged } from "./paged.ts";

export class PagedGroup {
    private _pageds:{};
    backlinks:Record<string,Record<string,Array<any>>>;
    constructor(){
        this._pageds={};
        this.backlinks={};
    }
    add(name:string,content:string){
        const paged=new Paged();
        paged.loadFromString(content,name);
        this._pageds[name]=paged;
        return paged;
    }
    async addHandle(name:string,handle:FileSystemHandle){
        const paged=new Paged();
        await paged.loadFromHandle(handle,name);
        this._pageds[name]=paged;
        return paged;
    }
    async addUrl(name:string,url:string){
        const paged=new Paged();
        await paged.loadFromUrl(url,name);
        this._pageds[name]=paged;
        return paged;    
    }

    get names() {
        return Object.keys(this._pageds);
    }
    clearDirty(name:string) {
        if (this._pageds[name]) this._pageds[name].clearDirty();
    }
    markDirty(name:string) {
        if (this._pageds[name]) this._pageds[name].markDirty();
    }
    getDirty(name:string) {
        return this._pageds[name]?.dirty||0;
    }    
    getItem(name:string){
        return this._pageds[name];
    }
    remove(name:string){
        delete this._pageds[name];
    }
    alignable=(name:string)=>{
        const out=Array<string>();
        const paged=this._pageds[name];
        if (!paged) return [];

        for (let key in this._pageds) {
            if (key==name) continue;
            if ( this._pageds[key].lastpage==paged.lastpage) {
                out.push( key )
            }
        }
        return out;
    }
    exists(key:string){
        return !!this._pageds[key];
    }
    get first() {
        return this.names.length?this.names[0]:'';
    }

}