import { Paged } from "./paged.ts";

export class PagedGroup {
    private _pageds:{};
    private _keeped={};// name of keepText
    backlinks:Record<string,Record<string,Array<any>>>;
    constructor(){
        this.reset();
    }
    reset(){
        this._pageds={};
        this.backlinks={};
        this._keeped={};
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
    markKeeped(name:string){
        this._keeped[name]=true;
    }
    
    clearKeeped(name:string){
        this._keeped[name]=false;
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
    keepCount(){
        return this.keeped;
    }
    getKeeped(name:string){
        return this._keeped[name];
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
            if ( this._pageds[key].lastpage==paged.lastpage
              //  || name.replace(/_[a-z][a-z]$/,'')==key.replace(/_[a-z][a-z]+$/,'') //same prefix, assume langauge code 2 chars
            ) {
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
    get keeped(){
        let keeped=0;
        for (let name in this._keeped) {
            if (this._keeped[name]) keeped++;
        }
        return keeped;
    }
}