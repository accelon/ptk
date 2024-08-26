/*
  *.pgd format
  
  #optional comments
  {json header}
  \t nameless record
  allow multi line
  name\t named record
*/
import {extractObject, jsonify} from '../utils/json.ts'
import {escapeTemplateString} from '../utils/misc.ts'
import {loadUrl} from '../utils/helper.ts'
import {PGDEXT} from './constants.ts'
import {verifyPermission} from '../platform/chromefs.ts'

export class Paged{
    private handle:FileSystemHandle;
    private pagetexts:Array<string>;
    private pagenames:Array<string>;
    private rawheader:string;//keep the comment #
    header:{};
    dirty:number;
    name:string;
	constructor () {
        this.pagenames= Array<string>();
        this.pagetexts= Array<string>();
        this.header={};
        this.rawheader='';
        this.dirty=0;
    }
    get lastpage() {return this.pagetexts.length-1}
    get filehandle() {return this.handle}
    async loadFromHandle(h:FileSystemHandle,_name:string){
        const workingfile=await h.getFile();
        const str=await workingfile.text(); 
        this.handle=h;
        this.name=_name;
        return this.loadFromString(str,_name);
    }
    async loadFromUrl(url:string,_name:string) {
        if (!~url.indexOf('http') && ~url.indexOf('/')) url='https://'+url
        else if (url.indexOf(PGDEXT)==-1) url+=PGDEXT
        url=url.replace('/jsbin/','/output.jsbin.com/')
        const text=await loadUrl(url);
        if (!_name) _name=(url.match(/([A-Za-z\-_]+)\.pgd/)||['','noname'])[1];
        return this.loadFromString(text,_name);
    }
    loadFromString(str:string,_name:string){
        const lines=str.split(/\r?\n/);
        for (let i=0;i<lines.length;i++) {
            const line=lines[i]
            const at=lines[i].indexOf('\t');
            if (~at) { //page breaker
                this.pagenames.push(line.slice(0,at))
                this.pagetexts.push(line.slice(at+1));
            } else { //normal line
                if (!this.pagetexts.length) {
                    this.pagetexts.push(line)
                    this.pagenames.push('')
                }
                else this.pagetexts[this.pagetexts.length-1]+='\n'+line;
            }
        }
        if (this.pagetexts.length<2) {
            this.pagetexts.push('blank page')
        }
        this.header=this.parseHeader(this.pagetexts[0]);
        this.name=_name;
        return this;
    }
    parseHeader(text:string){
        const out={};
        const lines=text.split('\n')
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
        return out;
    }
    listEntries(tofind:string,max=100) {
        const regex=new RegExp(tofind);
        const out=Array<string>();
        const N=this.pagenames;
        for (let i=1;i<N.length;i++) {
            if (N[i].match(regex)) {
                if (out.length>=max) break;
                if (N[i]) out.push(N[i]);
            }
        }
        return out;
    }
    scanEntries(tofind:string,max=100) {
        const regex=new RegExp(tofind);
        const out=Array<string>();
        const N=this.pagenames;
        const T=this.pagetexts;
        for (let i=1;i<N.length;i++) {
            if (!N[i]) continue;
            if (T[i].match(regex)) {
                if (out.length>=max) break;
                out.push(N[i]);
            }
        }
        return out;
    }
    dumpOffTsv(name:string){//create .off and .tsv from .pdg
        let offtext=Array<string>();
        let tsv=Array<string>();
        for (let i=0;i<=this.pagetexts.length-1;i++) {
            const t=this.pagetexts[i];
            offtext.push('^dk'+(i)+' '+t);//decode in pagedGroupFromPtk, chunk without name
            if (this.pagenames[i]) tsv.push(this.pagenames[i]+'\t'+i)
        }
        if (tsv.length) { //overwrite PtkFromPagedGroup default tsv header
            tsv.unshift("^:<name="+name+" preload=true>\tdkat=number");
            //dkat might have gap as some pages are nameless
        }
        return [offtext.join('\n'),tsv.join('\n')];
    }
    dump(escape=false){
        const out=[this.rawheader]; //TODO , sync from this.header
        for (let i=0;i<=this.pagetexts.length-1;i++) {
            const t=this.pagetexts[i];
            out.push(this.pagenames[i]+'\t'+(escape?escapeTemplateString(t):t));
        }
        return out.join('\n');
    }
    insertPage(thispage:number, newcontent=''){      
        if (!thispage)  return 0;
        this.pagetexts.splice(thispage,0,newcontent);
        this.pagenames.splice(thispage,0,'');
        return thispage+1;
    }
    deletePage(thispage:number){
        if (!thispage) return this;
        this.pagetexts.splice(thispage,1);
        this.pagenames.splice(thispage,1);
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
    pageText(n:number|string){
        if ( typeof n=='string' && parseInt(n).toString()!==n) {
            n=this.pagenames.indexOf(n);
        }
        return this.pagetexts[n];
    }
    pageName(n:number) {
        return this.pagenames[n];
    }
    setPageText(n:number|string,value:string){
        let m=-1;
        if (typeof n=='number') m=n;
        if ( typeof n=='string' && parseInt(n).toString()!==n) {
            m=this.pagenames.indexOf(n);
        }
        if (!~m) return ;
        if (m==0) {
            this.header=this.parseHeader(value);
        } else if (m>=0 && m<this.pagetexts.length) {
            this.pagetexts[m]=value;
        }
    }
}