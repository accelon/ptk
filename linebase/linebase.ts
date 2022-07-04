import {loadJSONP,loadNodeJsZip,loadFetch,loadNodeJs} from './loadpage.ts'
import {loadLines,pageOfLine} from './readline.ts';
import {writePages,append} from './writer.ts';
import {lineBreaksOffset} from '../utils/'
interface ILineBase {
	protected _data:string[];
	pagestarts:number[];
	protected header:Map;
	private _accsize:number;
	private pagesize:number;
	sealed:boolean;
}
export class LineBase {
	constructor (opts={}) {
		this._data=[];      // write time, line splited
		this._pages=[];     // read time,   line not split
		this._lineoffsets=[]; // lineoffsets of each page
		this._accsize=0;
		this.pagesize=opts.pagesize||1024*64;
		this.pagestarts=[];
		this.header={starts:[],sectionnames:[],sectionstarts:[],sectiontypes:[]};
		this.name=opts.name||'';
		this.zip=opts.zip;
		this.folder=opts.folder || this.name;
	    this.loadLines=loadLines.bind(this);
	    if (this.name) {
	    	this.sealed=true;
	        if (typeof window!=='undefined') {
	            const protocol=window.location.protocol;
	            if (protocol==='http:'||protocol==='https:'|| protocol==='chrome-extension:') {
	                this._loader=loadFetch.bind(this);
	            } else {
	                this._loader=loadJSONP.bind(this);
	            }
	        } else {
	        	this._loader=(this.zip?loadNodeJsZip:loadNodeJs).bind(this);	
	        }
	        this._loader(0);
	    } else {
	    	this.writePages=writePages.bind(this);
	    	this.append=append.bind(this);
	    }
	}
	setName(name) {
		this.name=name;
	}
	getPageLineOffset(page,line){
		if (page>=this._pages.length) return 0;

		if (line==0) return 0;
		if (line>= this._lineoffsets[page].length) return this._pages[page].length;
		return this._lineoffsets[page][line-1];
	}
	slice(nline,to){ //combine array of string from loaded pages
		const p1=pageOfLine(nline,this.pagestarts);
		const p2=pageOfLine(to,this.pagestarts);
		let i=0, out='' ,slicefrom,sliceto;
		for (let i=p1;i<=p2;i++) {
			if (!this._pages[i]) return [];//page not loaded yet
			if (i==p1 || i==p2) { // first or last part
				const slicefrom=this.getPageLineOffset(i, nline- (p1>0?this.pagestarts[p1-1]:0))+1;
				const sliceto=  this.getPageLineOffset(i, to- (p2>0?this.pagestarts[p2-1]:0) );
				if (p2>p1) {
					if (i==p1) out = this._pages[i].slice(slicefrom); //+1 skip the \n
					else out+= '\n'+this._pages[i].slice(0, sliceto);
				} else { //same block
					out= this._pages[i].slice(slicefrom,sliceto);
				}
			} else out+='\n'+this._pages[i];//middle
		}
		return out.split('\n');
	}
	isReady() { // ready to read or write
		if (!this.name) return true;//ready to write
		const that=this;
		let timer=0;
		return new Promise( (resolve)=>{
			timer=setInterval(()=>{
				if (that.payload) {
					clearInterval(timer);
					resolve(true);
				}
			},10);
		})
	}
    setPage(page,header,payload){
    	if (page==0) {
	        this.header=header;
	        this.pagestarts=header.starts;
    	    this.payload=payload||'nopayload';
    	} else if (page>0) {
    		this._pages[page-1]=payload;
    		this._lineoffsets[page-1] = lineBreaksOffset(payload);
    	}
    }
	private newPage(){
		this.pagestarts.push(this._data.length);
		this._accsize=0;
	}
	sectionRange(name:string,type=''):[from,to] {
		const notfound=[0,0];
		const {sectionnames,sectionstarts,sectiontypes}=this.header;
		if (!sectionnames || !sectionnames.length) return notfound;

		let at=sectionnames.indexOf(name);
		while (at>-1 ) {
			if (type!==sectiontypes[at]) {
				at=this.header.sectionnames.indexOf(name,at+1);
			} else {
				const endoflastsection=at< sectionstarts.length-1
					?sectionstarts[at+1]:this.pagestarts[this.pagestarts.length-1];
				return [sectionstarts[at], endoflastsection]
			}
		}
		return notfound;
	}
}