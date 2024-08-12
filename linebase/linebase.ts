import {loadJSONP,loadFetch,loadNodeJs,loadRemoteZip,loadInMemoryZipStore} from './loadpage.ts'
import {bsearchNumber,lineBreaksOffset,extractObject,unique} from '../utils/index.ts';
import {ILineRange} from './interfaces.ts'

let instancecount=0;
const combineRange=range=>{
	const combined=[];
	let from=0;
	range=range.filter((it: any)=>!!it);
	if (Array.isArray(range[0]) && range.length) {
		range.sort((a: number,b: number)=>a-b);
		from = range[0][0];
		for (let i=1;i<range.length;i++) {
			if (range[i][0]>range[i-1][1]) {
				combined.push([from,range[i-1][1]]);
				from = range[i][0];
			}
		}
		if (range[range.length-1][1]>from) combined.push([from,range[range.length-1][1]]);

	} else {
		return range;
	}
	return combined
}
export class LineBase{
	private _pages: never[];
	private _lineoffsets: never[];
	stamp: number;
	pagestarts: never[];
	header: { starts: never[]; sectionnames: never[]; sectionstarts: never[]; sectiontypes: never[]; };
	name: any;
	zip: any;
	zipstore: any;
	payload: any;
	private _loader: (page:any) => Promise<void>;
	failed: boolean;
	inmemory:boolean;
	constructor (opts={name:String,contentString:String,inmemory:Boolean}) {
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
    	//this._loader=()=>{};
        if (typeof window!=='undefined') {
            protocol=window.location.protocol;
        }
        if (this.zipstore) { //in memory zip
        	this._loader=loadInMemoryZipStore;
        } else if (protocol==='http:'||protocol==='https:'|| protocol==='chrome-extension:') {
            this._loader=loadFetch;
        } else if (protocol=='file:') {
            this._loader=loadJSONP;
        } else {
        	this._loader=this.zip?loadRemoteZip:loadNodeJs;
        }
        this.failed=false;
		if (opts.contentString) {
			const [headerstr,len]=extractObject(opts.contentString);
			const header=JSON.parse(headerstr);
			const lines=opts.contentString.slice(len).split('\n');
			const payload=lines.shift().replace(/\\n/g,'\n');
			this.setPage(0,header,payload)
			for (let i=0;i<header.starts.length;i++) {
				const pagedata=lines.slice( (i>0?header.starts[i-1]:0) , header.starts[i]);
				this.setPage(i+1,{},pagedata.join('\n'));
			}
			this.inmemory=true;
		} else if (!opts.inmemory) {
        	this._loader.call(this,0);
        }
	}
	async loadAll (){
		await this.loadLines([[0, this.pagestarts[this.pagestarts.length-1]]]);
		return this.slice(0,this.pagestarts[this.pagestarts.length-1]);
	}
	inMem(){
		return this.inmemory||this.zipstore;
	}
	pageOfLine=(line:number):number=>{
    	if (line>=this.pagestarts[this.pagestarts.length-1]) return this.pagestarts.length-1;
    	return bsearchNumber(this.pagestarts,line);
    }
	pageOfRange([from,to]){
	    if (from<0) return [];
	    if (from>to) to+=from;
	    let cstart=this.pageOfLine(from);
	    const cend=this.pageOfLine(to);
	    const notloaded=Array<number>();
		if (cstart>1) cstart--; //fetch previous page
	    for (let i=cstart;i<cend+1;i++) {
	        if (!this._pages[i]) notloaded.push(i);
	    }
	    return notloaded;
	}

	async loadLines(_range:number[] | ILineRange[]){
	    const that=this; //load a range, or a sequence of line or range.
	    let toload=[],
		range=combineRange(_range);
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
	     	jobs.push(this._loader.call(this,toload[i]+1));
	    }
	    await Promise.all(jobs);
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
	getLines(nlines:Array<number>){
		if (!nlines.length) return  [];
		let out=Array<number>();
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
	getLine(nline:number){
		return this.slice(nline,nline+1)[0];
	}
	slice(nline:number,to:number){ //combine array of string from loaded pages
		if (!to) to=nline+1;
		const p1=this.pageOfLine(nline,this.pagestarts);
		const p2=this.pageOfLine(to,this.pagestarts);
		let out='' ;
		for (let i=p1;i<=p2;i++) {
			if (!this._pages[i]) return out.split('\n');//page not loaded yet
			if (i==p1 || i==p2) { // first or last part
				let slicefrom=this.getPageLineOffset(i, nline- (p1>0?this.pagestarts[p1-1]:0));
				if (nline) slicefrom++; //skip the \n for first line
				const sliceto=this.getPageLineOffset(i,  to- (p2>0?this.pagestarts[p2-1]:0) );
				if (p2>p1) {
					if (i==p1) out = this._pages[i].slice(slicefrom); //+1 skip the \n
					else out+= (out?'\n':'')+this._pages[i].slice(0, sliceto); 
					//do not allow empty line become the first line
				} else { //same block
					out+=this._pages[i].slice(slicefrom,sliceto);
				}
			} else out+='\n'+this._pages[i];//middle
		}
		return out.split('\n');
	}
    setPage(page:number,header,payload:string){
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
	getSection(name:string){
		const [from,to]=this.sectionRange(name);
		if (from==to) return [];
		return this.slice(from,to);
	}	
	sectionRange(sname:string):ILineRange {
		const {sectionnames,sectionstarts}=this.header;
		if (!sectionnames || !sectionnames.length) return [0,0];
		for (let i=0;i<sectionnames.length;i++) {
			const name=sectionnames[i];
			if ( (sname && name==sname) ) {
				const endoflastsection=i< sectionstarts.length-1
					?sectionstarts[i+1]:this.pagestarts[this.pagestarts.length-1];

				return [sectionstarts[i], endoflastsection]				
			}
		}
		return [0,0];
	}
}