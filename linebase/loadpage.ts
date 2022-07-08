import { loadScript } from "../utils/loadscript.ts";
const pagefilename=page=>page.toString().padStart(3,'0')+'.js';
const makePageURI=(folder,page)=>{
    const fn=folder+'/'+pagefilename(page);
    return fn;
}
const parsePage=str=>{
    const start=str.indexOf('{');
    const end=str.indexOf('},`')+1;
    let payload=str.substring(end+2,str.length-2);
    //indexOf is much faster than regex, replace only when needed
    if (payload.indexOf("\\\\")>-1) payload=payload.replace(/\\\\/g,"\\");
    if (payload.indexOf("\\`")>-1)  payload=payload.replace(/\\`/g,"`");
    if (payload.indexOf("$\\{")>-1) payload=payload.replace(/\$\\\{/g,'${');

    return[JSON.parse(str.substring(start,end)), payload ];
}
export async function loadNodeJs (page){
    const fn=makePageURI(this.folder,page);
    try{
        const data=await fs.promises.readFile(fn,'utf8');
        this.setPage(page,...parsePage(data));
    } catch(e) {
        console.error('readFile failed,',fn,e);
    }
}

export async function loadNodeJsZip (page) { 
    const fn=this.name+'/'+pagefilename(page); 
    const f=this.zip.files[fn];
    const content=await f.async("string");
    //console.log(page,content.slice(0,100))
    // const lines= ;
    // if (page==1) console.log(content.slice(0,100),lines)
    this.setPage(page,...parsePage(content));
}

export async function loadFetch(page){
    if (this.zip) {
        const data=await this.zip.readTextFile(this.name+'/'+pagefilename(page));
        this.setPage(page,...parsePage(data));
        return;
    }
    const uri=makePageURI(this.folder,page);
    try {
        const res=await fetch(uri);
        if (!res.ok) throw res.statusText;
        this.setPage(page, ...parsePage(await res.text()) );
    } catch(e) {
        console.error('fetch failed,',uri);
    }
}
const jsonp=function(page,header,_payload){
    const payload=_payload.split(/\r?\n/);
    this.loadPage(page,header,payload); //this is binded to rom, not in pool yet for first page
}

export async function loadJSONP(page){
    if (!typeof window.jsonp!=='function') {
        window.jsonp=jsonp.bind(this);
    }
    return loadScript(makePageURI(this.folder,page),()=>{
        this.loadedPage[page]=true;
    });
}
