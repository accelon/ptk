import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'
const makePageJsonp=(name,page,start,payload)=>{
	return 'jsonp('+page+',{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
}
const makeHeader=(name,header,pagestarts,payload)=>{
	const meta=Object.assign( {} , header,{name,starts:pagestarts,buildtime:new Date()})
	return 'jsonp(0,'+JSON.stringify(meta)+',`'+escapeTemplateString(payload)+'`)';
}

export class LineBaser {
	constructor (opts={}) {
		this._data=[];      // write time, line splited
		this._lineoffsets=[]; // lineoffsets of each page
		this._accsize=0;
		this.pagesize=opts.pagesize||1024*64;
		this.pagestarts=[];
		this.payload=''
		this.header={starts:[],sectionnames:[],sectionstarts:[],sectiontypes:[],preload:[]
			,fulltext:[],fulltextcaption:[],eot:0};
		this.name=opts.name||'';
		this.zip=opts.zip;
	    this.onAddLine=null;
	}
	setName(name) {
		this.name=name;
	}
	dump(cb) {
		if (!this.name) {
			throw "need a name before dumping"
		}
		this.newPage();
		let start=0;
		const jsonpfn=pagejsonpfn(0);
		cb(jsonpfn, makeHeader(this.name,this.header||{},this.pagestarts,this.payload) ,0);
		for (let i=0;i<this.pagestarts.length;i++) {
			const lines=this._data.slice(start,this.pagestarts[i]);
			const towrite=makePageJsonp(this.name,i+1,start,escapeTemplateString(lines.join('\n')));
			const done=cb( pagejsonpfn(i+1) , towrite, i+1);
			if (done) break;
			start=this.pagestarts[i]
		}
		this._data=[];
		this._accsize=0;
		this._pagestart=[];
	}
	private newPage(){
		this.pagestarts.push(this._data.length);
		this._accsize=0;
	}
	async loadSection(name,type){
		const [from,to]=this.sectionRange(name,type);
		if (to>from) {
			await this.loadLines(from,to);
			return this.slice(from,to)
		}
		return [];
	}	
	addLine (line:string, samepage=false){
		if (this.sealed) throw ('sealed');
		this._data.push(line);
		this._accsize+=line.length;
		if (this._accsize>this.pagesize && !samepage) this.newPage();
	}
	addSection(name:string,type:string){
		if (!name) name=(this.header.sectionnames.length+1).toString();
		if (!this.header.sectionnames) {
			this.header.sectionnames=[];
			this.header.sectionstarts=[];
			this.header.sectiontypes=[];
		};
		this.header.sectionnames.push(name);
		this.header.sectionstarts.push(this._data.length);
		this.header.sectiontypes.push(type);
	}
	append(buffer:(string|string[]), opts={}){
		const name=opts.name||'';
		const newpage=opts.newpage;    // start a new page
		const samepage=opts.samepage;  // save in same page , no matter how big it is
		const type=opts.sourcetype||opts.type;

		if ((buffer.length+this._accsize>this.pagesize|| newpage) && this._data.length) {
			this.newPage(); //start a new page for big buffer.
		}
		if (name) this.addSection(name,type);
		const lines=Array.isArray(buffer)?buffer:buffer.split(/\r?\n/);

		for (let i=0;i<lines.length;i++) {
			if (this.onAddLine) {
				const text = this.onAddLine(lines[i], i , name);
				if (typeof text==='string') this.addLine(text, samepage);
			} else {
				this.addLine(lines[i]||'', samepage);
			}
		}
	}
}