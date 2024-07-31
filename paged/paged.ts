import {extractObject, jsonify} from '../utils/json.ts'
import {escapeTemplateString} from '../utils/misc.ts'
import {loadUrl} from '../utils/helper.ts'
import {PGDEXT} from './constants.ts'
import {verifyPermission} from '../platform/chromefs.ts'

export class Paged{
    private handle:FileSystemHandle;
    data:{};
    dirty:number;
    private pagecount:number;
	constructor () {
        this.data={};
        this.dirty=0;
        this.pagecount=0;
    }
    get lastpage() {return this.pagecount}
    get filehandle() {return this.handle}
    async loadFromHandle(h:FileSystemHandle){
        const workingfile=await h.getFile();
        const str=await workingfile.text(); 
        this.handle=h;
        return this.loadFromString(str);
    }
    async loadFromUrl(url:string) {
        if (~url.indexOf('/')) url='https://'+url
        else if (url.indexOf(PGDEXT)==-1) url+=PGDEXT
        url=url.replace('/jsbin/','/output.jsbin.com/')
        const text=loadUrl(url);
        return this.loadFromString(text);
    }
    loadFromString(str:string){
        const obj={};
        const lines=str.split(/\r?\n/);
        let key='', page=0,autopage=false;
        const header=Array<string>();
        for (let i=0;i<lines.length;i++) {
            const line=lines[i]
            const at=lines[i].indexOf('\t');
            if (at==0) {
                autopage=true;
                page++;
                obj[page.toString()]=line.slice(1);
                key=page.toString();
            } else if (at>0) {
                key=line.substring(0,at);
                if (parseInt(key).toString()==key) throw "cannot be pure number"
                const payload=line.substring(at+1);
                if (obj.hasOwnProperty(key)) {
                } else {
                    obj[key]=payload;
                }    
            } else if (key) {
                obj[key]+='\n'+line;
            } else {
                header.push(line);
            }
        }
        obj[""]=header.join('\n');
        if (!obj.hasOwnProperty("1")) {
            obj["1"]='Blank Page';
        }
        this.data=obj;
        this.pagecount=this.countLastPage();
        return this;
    }
    parseHeader(str:string){
        const lines=str.split('\n');
        const out={};
        for (let i=0;i<lines.length;i++) {
            const line=lines[i];
            const ch=line.charAt(0);
            if (ch==='#') continue;
            if (ch==='{') {
                const [objstr]=extractObject(line);
                try {
                    const obj=jsonify(objstr);
                    for (let key in obj) {
                        out[key]=obj[key];
                    }   
                } catch {
                    console.log("header error", line);
                }
            }
        }
        return out
    }
    countLastPage(){
        let last=1;
        if (!this.data) return 0;
        for (let i in this.data) {
            const int=parseInt(i)
            if (int>last && int.toString()==i) {
                last=int;
            }
        }
        return last;
    }
    dump(escape=false){
        const out=(this.data[""]||"").split('\n');
        const lastpage=this.countLastPage();
        for (let i=1;i<=lastpage;i++) {
            out.push('\t'+(escape?escapeTemplateString(this.data[i]):this.data[i]));
        }
        for (let key in this.data) {
            if (key=="" || parseInt(key).toString()==key) continue;
            out.push(key+'\t'+(escape?escapeTemplateString(this.data[key]):this.data[key]));
        }
        return out.join('\n');
    }
    insertPage(thispage:number, newcontent=''){
        const newobj={};
        for (let key in this.data) {
            const page=parseInt(key)
            if (page.toString()==key && page>thispage) {
                newobj[page+1]=this.data[page];
            } else {
                newobj[page]=this.data[page];
            }    
        }
        newobj[thispage+1]=newcontent;
        this.data=newobj;
        this.pagecount++;
        return this;
    }
    deletePage(thispage:number){
        const newobj={}
        if (thispage>this.pagecount) return;
        for (let key in this.data){
            const page=parseInt(key);
            if (page.toString()==key && page>thispage) {
                newobj[page-1]=this.data[page];
            } else {
                newobj[page]=this.data[page];
            }
        }
        this.data=newobj;
        if (this.pagecount>0) this.pagecount--;
        return this;
    }
    async browserSave(opts){
        const out=this.dump();
        let handle=this.handle;
        if (!handle) {
            handle=await window.showSaveFilePicker(opts);
        }
        if (!handle) return;
        
        if (await verifyPermission( handle,true)) {
            const writable = await handle.createWritable();
            await writable.write(out);
            await writable.close();
            this.dirty=0;
            return true;
        }
        return false;
    }
}