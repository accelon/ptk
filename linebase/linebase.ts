import {loadJSONP,loadNodeJsZip,loadFetch,loadNodeJs} from './loadpage.ts'
import {loadLines,notloadedPage} from './readline.ts';
import {writePages,addBuffer,addLine} from './writer.ts';

interface ILineBase {
	protected _data:string[];
	pages:number[];
	protected header:Map;
	private _accsize:number;
	private pagesize:number;
	sealed:boolean;
}
export class LineBase {
	constructor (opts={}) {
		this._data=[];
		this._accsize=0;
		this.pagesize=opts.pagesize||1024*64;
		this.pages=[];
		this.header={};
		this.name=opts.name||'';
		this.zip=opts.zip;
		this.folder=opts.folder || this.name;
		this.loadedPage=[];
	    this.loadLines=loadLines.bind(this);
	    this.notloadedPage=notloadedPage.bind(this);
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
	    	this.addBuffer=addBuffer.bind(this);
	    	this.addLine=addLine.bind(this);
	    }
	}
	setName(name) {
		this.name=name;
	}
	slice(nline,to){
		return this._data.slice(nline,to);
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
	build(){
		if (this.sealed) throw 'already sealed';
		console.log('building')
	}
    setPage(page,header,payload){
    	if (page==0) {
	        this.header=header;
    	    this.payload=payload||'nopayload';
    	} else if (page>0) {
    		let i=0;
    		while (i<payload.length) {
    			this._data[i+header.start]=payload[i];
    			i++;
    		}
    		this.loadedPage[page-1]=true;
    	}
    }
	private newPage(){
		this.pages.push(this._data.length);
		this._accsize=0;
	}
}