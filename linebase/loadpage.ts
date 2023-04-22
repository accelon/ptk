import { loadScript,parseJsonp } from "../utils/loadscript.ts";
import {poolGet} from '../basket/pool.ts';
const pagefilename=page=>page.toString().padStart(3,'0')+'.js';
const makePageURI=(folder,page)=>{
    const fn=folder+'/'+pagefilename(page);
    return fn;
}

export async function loadNodeJs (page){
    let fn=makePageURI(this.name,page);
    //try sibling folder
    if (! fs.existsSync(fn) && fs.existsSync('../'+this.name+'/'+this.name)) {
        fn=makePageURI('../'+this.name+'/'+this.name,page);
    }
    try{
        const data=await fs.promises.readFile(fn,'utf8');
        this.setPage(page,...parseJsonp(data));
    } catch(e) {
        console.error('readFile failed,',fn,e);
    }
}

export async function loadRemoteZip (page){
    throw 'not implement yet';
}

export async function loadInMemoryZipStore (page) { 
    let content;
    const fn=this.name+'/'+pagefilename(page);
    for (let i=0;i<this.zipstore.files.length;i++) {
        if (this.zipstore.files[i].name==fn) {
            content=new TextDecoder().decode(this.zipstore.files[i].content);
        }
    }
    content&&this.setPage(page,...parseJsonp(content));
}

export async function loadFetch(page){
    if (this.zip) {
        const data=await this.zip.readTextFile(this.name+'/'+pagefilename(page));
        this.setPage(page,...parseJsonp(data));
        return;
    }
    const uri=makePageURI(this.name,page);
    try {
        const res=await fetch(uri);
        const text=await res.text();
        const arr=parseJsonp(text)
        this.setPage(page, ...arr );
    } catch(e) {
        this.failed=true;
    }
}
const jsonp=(page,header,_payload)=>{
    const ptk=poolGet(header.name);
    ptk.setPage(page,header,_payload);
}
function isLoaded(page:number){
   return (page==0)?this.pagestarts.length:this._pages[page-1];
}
export async function loadJSONP(page){
    if (isLoaded.call(this,page)) return;
    if (!typeof window.jsonp!=='function') {
        window.jsonp=jsonp;
    }
    let  tried=0,timer ;
    const that=this;
    try {
        const status=await loadScript(makePageURI(that.name,page),()=>{
            if (isLoaded.call(that,page)) return true;
            //wait for jsonp() to setPage
            timer=setInterval(()=>{
                tried++;
                if (tried>10 || isLoaded.call(that,page) ) {
                    if (tried>10) console.error('failed loading page',page,that.name);
                    clearInterval(timer);
                }
            },10);
        });
    } catch(e) {
        this.failed=true;
    }
}
