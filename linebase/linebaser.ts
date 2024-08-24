import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'
const makePageJsonp=(name:string,page:number,start:number,payload:string)=>{
	return 'jsonp('+page+',{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
}
const makeHeader=(name:string,header,pagestarts)=>{
	const meta=Object.assign( {} , header,{name,starts:pagestarts,buildtime:new Date()})
	return JSON.stringify(meta);
}

export class LineBaser {
	private _data:Array<string>;
	private _accsize:number;
	pagesize:number;
	pagestarts:Array<number>;
	payload:string;
	header:{starts:Array<number>,sectionnames:Array<string>
		,sectionstarts:Array<string>,sectiontypes:Array<string>,
		preload:Array<string>,
		fulltext:Array<string>,fulltextcaption:Array<string>,
		eot:number
	};
	name:string;
	onAddLine:Function;
	sealed:Boolean;
	zip:any
	constructor (opts={}) {
		this._data=[];      // write time, line splited
		this._accsize=0;
		this.pagesize=opts.pagesize||1024*64;
		this.pagestarts=[];
		this.payload=''
		this.sealed=false;
		this.header={starts:[],sectionnames:[],sectionstarts:[],sectiontypes:[],preload:[]
			,fulltext:[],fulltextcaption:[],eot:0};
		this.name=opts.name||'';
		this.zip=opts.zip;
	}
	setName(name) {
		this.name=name;
	}
	asString(escape=false){
		const header=makeHeader(this.name,this.header||{},this.pagestarts)
		const text=escape?escapeTemplateString(this._data.join('\n')):this._data.join('\n')
		//payload right after header json object, a single string
		return header+this.payload.replace(/\n/g,'\\n')+'\n'+text;
	}
	dumpJs(cb:Function) {
		if (!this.name) {
			throw "need a name before dumping"
		}
		this.newPage();//finalize last page;
		let start=0;
		const jsonpfn=pagejsonpfn(0);
		const headerstring='jsonp(0,'+makeHeader(this.name,this.header||{},this.pagestarts)+',`'+escapeTemplateString(this.payload)+'`';
		cb(jsonpfn, headerstring ,0);
		for (let i=0;i<this.pagestarts.length;i++) {
			const lines=this._data.slice(start,this.pagestarts[i]);
			const towrite=makePageJsonp(this.name,i+1,start,escapeTemplateString(lines.join('\n')));
			const done=cb( pagejsonpfn(i+1) , towrite, i+1);
			if (done) break;
			start=this.pagestarts[i]
		}
		this._data=[];
		this._accsize=0;
		this.pagestarts=[];
	}
	private newPage(){
		this.pagestarts.push(this._data.length);
		this._accsize=0;
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
		if (name.startsWith("_")&&!type) type=name.slice(1); // _tokens, _postings, and _toc

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