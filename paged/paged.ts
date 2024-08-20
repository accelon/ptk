import {extractObject, jsonify} from '../utils/json.ts'
import {escapeTemplateString} from '../utils/misc.ts'
import {loadUrl} from '../utils/helper.ts'
import {PGDEXT} from './constants.ts'
import {verifyPermission} from '../platform/chromefs.ts'
import {offTagType, unitize } from 'ptk/offtext/parser.ts'
import { parsePageBookLine } from "../offtext/parser.ts";
import { removeBracket } from "../utils/cjk.ts";

export class Paged{
    private handle:FileSystemHandle;
    private pagetexts:Array<string>;
    private entrytexts:{};
    private rawheader:string;//keep the comment #
    header:{};
    anchors:Array<any>
    anchornames:Array<string>
    anchorpagelines:Array<[number,number,string]>
    dirty:number;
    name:string;
	constructor () {
        this.pagetexts= Array<string>();
        this.entrytexts={};
        this.header={};
        this.anchors=[];
        this.anchornames=[];
        this.anchorpagelines=[];
        this.rawheader='';
        this.dirty=0;
    }
    get lastpage() {return this.pagetexts.length}
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
        const obj={};
        const lines=str.split(/\r?\n/);
        let key='', isEntry=false;
        for (let i=0;i<lines.length;i++) {
            const line=lines[i]
            const at=lines[i].indexOf('\t');
            if (at==0) { //page breaker
                isEntry=false;
                this.pagetexts.push(line.slice(1));
            } else if (at>0) { //entry
                isEntry=true;
                key=line.substring(0,at);
                if (parseInt(key).toString()==key) throw "cannot be pure number"
                const payload=line.substring(at+1);
                if (obj.hasOwnProperty(key)) {
                } else {
                    this.entrytexts[key]=payload;
                }    
            } else { //normal line
                if (isEntry) {
                    this.entrytexts[key]+='\n'+line;
                } else {//text section starts
                    if (!this.pagetexts.length) this.pagetexts.push(line)
                    else this.pagetexts[this.pagetexts.length-1]+='\n'+line;
                }
            }
        }
        if (this.pagetexts.length<2) {
            this.pagetexts.push('blank page')
        }
        this.header=this.parseHeader(this.pagetexts[0]);
        this.buildAnchor();
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
        for (let key in this.entrytexts) {
            if (key.match(regex)) {
                if (out.length>=max) break;
                out.push(key);
            }
        }
        return out;
    }
    scanEntries(tofind:string,max=100) {
        const regex=new RegExp(tofind);
        const out=Array<string>();
        for (let key in this.entrytexts) {
            if (this.entrytexts[key].match(regex)) {
                if (out.length>=max) break;
                out.push(key);
            }
        }
        return out;
    }
    dumpOffTsv(name:string){//create .off and .tsv from .pdg
        let offtext=Array<string>();
        let tsv=Array<string>();

        for (let i=0;i<=this.pagetexts.length-1;i++) {
            const t=this.pagetexts[i];
            offtext.push('^ck'+(i+1)+' '+t);//decode in pagedGroupFromPtk
        }
        
        for (let key in this.entrytexts) {
            const t=this.entrytexts[key];
            tsv.push(key+'\t'+t.replace(/\n/g,'^p '));
        }
        if (tsv.length) {
            tsv.unshift('^:<name="'+ name+'.tsv'+'">\tdef');
        }
        return [offtext.join('\n'),tsv.join('\n')];
    }
    dump(escape=false){
        const out=[this.rawheader]; //TODO , sync from this.header
        for (let i=0;i<=this.pagetexts.length-1;i++) {
            const t=this.pagetexts[i];
            out.push('\t'+(escape?escapeTemplateString(t):t));
        }
        for (let key in this.entrytexts) {
            const t=this.entrytexts[key];
            out.push(key+'\t'+(escape?escapeTemplateString(t):t));
        }
        return out.join('\n');
    }
    insertPage(thispage:number, newcontent=''){      
        if (!thispage)  return 0;
        this.pagetexts.splice(thispage,0,newcontent);
        return thispage+1;
    }
    deletePage(thispage:number){
        if (!thispage) return this;
        this.pagetexts.splice(thispage,1);
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
    entryText(entry:string){
        return this.entrytexts[entry];
    }
    pageText(n:number){
        return this.pagetexts[n];
    }
    setPageText(n:number,value:string){
        if (n==0) {
            this.header=this.parseHeader(value);
        } else if (n>=0 && n<this.pagetexts.length) {
            this.pagetexts[n]=value;
        }
    }
    setEntryText(entry:string,value:string){
        this.entrytexts[entry]=value;
    }
    findAnchor(id:string){//page,line,name
        const at=this.anchornames.indexOf(id);
        if (~at) return [...this.anchorpagelines[at],this.anchornames[at]]
        return [];
    }
    sliceOfAnchor(id:string) {  //pagetext, yidarr in this page
        const at=this.anchornames.indexOf(id);
        const yidarr=[];
        if (!~at) return ['',yidarr];
        const [spage,sline]=this.anchorpagelines[at];
        let [epage,eline]=this.anchorpagelines[at+1]||[];
        let text='';
        const lines=this.pagetexts[spage-1].split('\n');
        // the slice will not cross page boundary
        text=lines.slice(sline,epage>spage?lines.length:eline).join('\n')
        return [text,yidarr,spage]
    }
    buildAnchor(){
        const out=Array<any>();
        const tagnames=Array<string>();
        const taglines=Array<[number,number,string]>();
        const texts=this.pagetexts;
        for (let i=0;i<texts.length;i++) {
            const lines=texts[i].split('\n');
            for (let j=0;j<lines.length;j++){
                const units=unitize(lines[j]);
                for (let k=0;k<units.length;k++) {
                    if (units[k].startsWith('^z')||units[k].startsWith('^y')) {
                        out.push({caption:units[k], page:i+1, line:j});
                        const [text,type,offtag]=offTagType(units[k].slice(1));
                        tagnames.push(offtag);
                        taglines.push([i+1,j,text]);
                    }
                }
            }
        }
        this.anchors=out;
        this.anchornames=tagnames;
        this.anchorpagelines=taglines;
    }
    upperYid=(yid:string)=>{
        const [page]=parsePageBookLine(yid)
        let newyid=page.replace(/\d+$/,'');
        if (newyid==page) {
            newyid=page.replace(/[a-z]+$/,'');
        }
        return newyid;
    }
    bookTitle(yid:string) {
        const header=this.header;
        const upper=this.upperYid(yid);
        const c=this.findAnchor(upper);
        let res=(header.title?'':'@'+paged.name)+//缺title 要補上fn
        '《'+(header.title?header.title+'．':'')+ removeBracket(c[2])+'》';
        return res;
    }
}