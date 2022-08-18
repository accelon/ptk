import {loadJSONP,loadNodeJsZip,loadFetch,loadNodeJs,loadRemoteZip,loadInMemoryZipStore} from './loadpage.ts'
import {bsearchNumber,lineBreaksOffset,unique} from '../utils/index.ts';
import {ILineRange} from './interfaces.ts'
let instancecount=0;
export class LineBase{
	constructor (opts={}) {
		this.stamp=++instancecount;
		this._pages=[];     // read time,   line not split
		this._lineoffsets=[]; // lineoffsets of each page
		this.pagestarts=[];
		this.header={starts:[],sectionnames:[],sectionstarts:[],sectiontypes:[]};
		this.name=opts.name||'';
		this.zip=opts.zip;
		this.zipstore=opts.zipstore;
		this.payload;   //payload in 000.js
    	let protocol=typeof chrome!=='undefined'?'chrome-extension:':'';
    	this._loader=()=>{};
        if (typeof window!=='undefined') {
            protocol=window.location.protocol;
        }
        if (this.zipstore) { //local in memory zip
        	this._loader=loadInMemoryZipStore;
        } else if (protocol==='http:'||protocol==='https:'|| protocol==='chrome-extension:') {
            this._loader=loadFetch;
        } else if (protocol=='file:') {
            this._loader=loadJSONP;
        } else {
        	this._loader=this.zip?loadRemoteZip:loadNodeJs;
        }
        this.failed=false;
        if (!opts.inmemory) {
        	this._loader.call(this,0);
        }
	}
	async loadAll (){
		await this.loadLines([[0, this.pagestarts[this.pagestarts.length-1]]]);
	}
	inMem(){
		return this.inmemory||this.zipstore;
	}
	pageOfLine=(line)=>{
    	if (line>=this.pagestarts[this.pagestarts.length-1]) return this.pagestarts.length-1;
    	return bsearchNumber(this.pagestarts,line,true);
    }
	pageOfRange([from,to]){
	    if (from<0) return [];
	    if (from>to) to+=from;
	    const cstart=this.pageOfLine(from);
	    const cend=this.pageOfLine(to);    
	    const notloaded=[];
	    for (let i=cstart;i<cend+1;i++) {
	        if (!this._pages[i]) notloaded.push(i);
	    }
	    return notloaded;
	}
	async loadLines(range:number[] | ILineRange[]){
	    const that=this; //load a range, or a sequence of line or range.
	    let toload=[];

        const notincache={};
        for (let i=0;i<range.length;i++) {
        	if (Array.isArray(range[i])) {
        		const [from,to]=range[i];
        		toload.push(...this.pageOfRange([from,to]));
        	} else {
        		notincache[this.pageOfLine(range[i])]=true; 
        	}
        }
        toload.push(...Object.keys(notincache).map(it=>parseInt(it)));

	    toload=unique(toload.filter(it=> !that._pages[it]));
	    const jobs=[];
    	for (let i=0;i<toload.length;i++) {
	     	await this._loader.call(this,toload[i]+1)
	    }
	}	
	lineCount(){
		return this.header.starts[this.header.starts.length-1];
	}
	getPageLineOffset(page,line){
		if (page>this._pages.length) return 0;

		if (line==0) return 0;
		if (line>this._lineoffsets[page].length) return this._pages[page].length;
		return this._lineoffsets[page][line-1];
	}
	getLines(nlines){
		if (!nlines.length) return  [];
		let out=[];
		let pline=nlines[0];
		let start=pline;
		for (let i=1;i<nlines.length;i++) {
			if (pline+1!==nlines[i]) {
				out=out.concat(this.slice(start,i));
				start=nlines[i];
			}
			pline=nlines[i];
		}
		out=out.concat(this.slice(start,pline+1));
		return out;
	}
	getLine(nline){
		return this.slice(nline,nline+1)[0];
	}
	slice(nline,to){ //combine array of string from loaded pages
		if (!to) to=nline+1;
		const p1=this.pageOfLine(nline,this.pagestarts);
		const p2=this.pageOfLine(to,this.pagestarts);
		let i=0, out='' ,slicefrom,sliceto;
		for (let i=p1;i<=p2;i++) {
			if (!this._pages[i]) return [];//page not loaded yet
			if (i==p1 || i==p2) { // first or last part
				let slicefrom=this.getPageLineOffset(i, nline- (p1>0?this.pagestarts[p1-1]:0));
				if (nline) slicefrom++; //skip the \n for first line
				const sliceto=this.getPageLineOffset(i, to- (p2>0?this.pagestarts[p2-1]:0) );
				if (p2>p1) {
					if (i==p1) out = this._pages[i].slice(slicefrom); //+1 skip the \n
					else out+= (out?'\n':'')+this._pages[i].slice(0, sliceto); 
					//do not allow empty line become the first line
				} else { //same block
					out= this._pages[i].slice(slicefrom,sliceto);
				}
			} else out+='\n'+this._pages[i];//middle
		}
		return out.split('\n');
	}
    setPage(page,header,payload){
    	if (page==0) {
	        this.header=header;
	        this.name=this.header.name;
	        this.pagestarts=header.starts;
    	    this.payload=payload||'nopayload'; 
    	    this.opened=true;
    	} else if (page>0) {
    		this._pages[page-1]=payload;
    		this._lineoffsets[page-1] = lineBreaksOffset(payload);
    	}
    }
	isReady() {
		if (this.payload) return true;
		const that=this;
		let timer=0;
		return new Promise(resolve=>{
			timer=setInterval(()=>{
				if (that.failed) resolve(false); //set by loadScript, loadFetch
				else if (that.payload) {
					clearInterval(timer);
					resolve(true);
				}
			},50);
		})
	}
	async preloadSection(name,type,headeronly=false){
		let [from,to]=this.sectionRange(name,type);
		if (headeronly) to=from+1;
		await this.loadLines([[from,to]]);
	}
	getSection(name,type){
		const [from,to]=this.sectionRange(name,type);
		return this.slice(from,to);
	}	
	sectionRange(sname:string):ILineRange {
		const notfound=[0,0];
		const {sectionnames,sectionstarts,sectiontypes}=this.header;
		if (!sectionnames || !sectionnames.length) return notfound;
		for (let i=0;i<sectionnames.length;i++) {
			const name=sectionnames[i];
			if ( (sname && name==sname) ) {
				const endoflastsection=i< sectionstarts.length-1
					?sectionstarts[i+1]:this.pagestarts[this.pagestarts.length-1];

				return [sectionstarts[i], endoflastsection]				
			}
		}
		return notfound;
	}
}