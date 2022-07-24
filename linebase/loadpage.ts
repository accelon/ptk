import { loadScript } from "../utils/loadscript.ts";
const pagefilename=page=>page.toString().padStart(3,'0')+'.js';
const makePageURI=(folder,page)=>{
    const fn=folder+'/'+pagefilename(page);
    return fn;
}

export async function loadNodeJs (page){
    const fn=makePageURI(this.name,page);
    try{
        const data=await fs.promises.readFile(fn,'utf8');
        this.setPage(page,...parseJsonp(data));
    } catch(e) {
        console.error('readFile failed,',fn,e);
    }
}

export async function loadZip (page) { 
    let content;
    const fn=this.name+'/'+pagefilename(page);
    for (let i=0;i<this.zip.files.length;i++) {
        if (this.zip.files[i].name==fn) {
            content=this.zip.files[i].content;
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
        // if (!res.ok) throw res.statusText;
        this.setPage(page, ...parseJsonp(await res.text()) );
    } catch(e) {
        this.failed=true;
       // console.error('fetch failed,',uri);
    }
}
const jsonp=function(page,header,_payload){
    this.setPage(page,header,_payload); //this is binded to rom, not in pool yet for first page
}
function isLoaded(page:number){
   return (page==0)?this.pagestarts.length:this._pages[page-1];
}
export async function loadJSONP(page){
    if (isLoaded.call(this,page)) return;
    if (!typeof window.jsonp!=='function') {
        window.jsonp=jsonp.bind(this);
    }
    let  tried=0,timer ;
    const that=this;
    try {
        const status=await loadScript(makePageURI(this.name,page),()=>{
            if (isLoaded.call(that,page)) return true;
            //wait for jsonp() to setPage
            timer=setInterval(()=>{
                tried++;
                if (tried>10 || isLoaded.call(that,page) ) clearInterval(timer);
            },30);
        });
    } catch(e) {
        this.failed=true;
    }
}
