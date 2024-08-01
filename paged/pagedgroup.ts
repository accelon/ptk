import { Paged } from "./paged.ts";

export class PagedGroup {
    private _pageds:{};
    constructor(){
        this._pageds={};
    }
    add(name:string,content:string){
        const paged=new Paged();
        paged.loadFromString(content);
        this._pageds[name]=paged;
        return paged;
    }
    addHandle(name:string,handle:FileSystemHandle){
        const paged=new Paged();
        paged.loadFromHandle(handle);
        this._pageds[name]=paged;
        return paged;
    }
    async addUrl(name:string,url:string){
        const paged=new Paged();
        await paged.loadFromUrl(url);
        this._pageds[name]=paged;
        return paged;    
    }

    get names() {
        return Object.keys(this._pageds);
    }
    clearDirty(name:string) {
        if (this._pageds[name]) this._pageds[name].dirty=0;
    }
    setDirty(name:string) {
        if (this._pageds[name]) this._pageds[name].dirty++;
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
            if ( this._pageds[key].lastpage== lastpage) {
                out.push( key )
            }
        }
        return out;
    }
    get first() {
        return this.names.length?this.names[0]:'';
    }
}