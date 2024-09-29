import {LineBase,Column} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {bsearchNumber} from '../utils/index.ts';
import {Templates} from '../compiler/template.ts'
export const regPtkName =  /^[a-z\-_]{2,16}$/
export const validPtkName=(name:string):boolean=>!!name.match(regPtkName);
export class Pitaka extends LineBase {
	defines:Record<string,any>
	primarykeys:Record<string,any>
	columns:Record<string,any>
	attributes:Record<string,string>
	tocs:Record<string,any>
	rangeOfAddress:Function
	tagAtAction:Function
	innertext:Function
	inverted:any
	lang:string
	template:any
	constructor(opts:Record<string,any>){
		super(opts);
		this.defines={};
		this.attributes={};
		this.primarykeys={};
		this.columns={};
		this.inverted=null;
		this.lang='';
	}
	async init(){
		if (!this.payload) return;
		const compiler=new Compiler();
		compiler.compileBuffer(this.payload, '0.off');
		this.defines=compiler.typedefs;
		this.attributes=compiler.compiledFiles['0.off']?.attributes;
		this.lang=this.attributes.lang||'zh';
		this.template=Templates[this.attributes.template]||Templates.generic;
		const ranges=Array<any>();

		//load required section data
		for (let i=0;i<this.header.preload.length;i++) {
			const r=this.sectionRange(this.header.preload[i]);
			if (r&&r[1]>r[0])ranges.push(r);
		}
		for (let n in this.defines) {
			if (!this.defines[n].fields.lazy) {
				const r=this.sectionRange('^'+n);
				if (r&&r[1]>r[0]) ranges.push(r);
			}
		}
		if (!this.inmemory) await this.loadLines(ranges);	
		
		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			if (section.length)	this.deserialize(section,this.header.preload[i]);
			// else console.error('empty section',this.header.preload[i]);
		}
		for (const n in this.defines) { //see compiler/typedef.ts serialize()
			if (!this.defines[n].fields.lazy) {
				const section=this.getSection('^'+n);
				if (section && section.length) {
					this.defines[n].deserialize(section,this,n); //call typedef.ts:deserialize
				} else {
					this.defines[n].empty=true;
				}
			}
			for (let attr in this.defines[n].fields) {
				const A=this.defines[n].fields[attr];
				if (A.foreign && this.primarykeys[A.foreign]) {
					A.keys=this.primarykeys[A.foreign];
				}
			}
		}
		for (const n in this.defines) {
			if (this.defines[n].empty) delete this.defines[n];
		}
		//link column and define
		for (const n in this.columns) {
			const tagname=(this.columns[n].attrs?.tagname)
			if (tagname && this.defines[tagname]){
				this.defines[tagname].column=n;
			}
		}
	}
	deserialize(section:Array<string>,sectionname:string) {	
		if (!section.length) return;
		if (!section[0]) section.shift();
		if (!section.length) return;
		const firstline=section[0];
		const {name}=sourceType(firstline);
		const at=this.header.sectionnames.indexOf(sectionname);
		const sourcetype=this.header.sectiontypes[at];
		if (sourcetype==='tsv') { // linebaser.ts addSection()
			const column=new Column();
			column.deserialize(section);
			this.columns[column.name]=column;			
			this.primarykeys[column.name]=column.keys;
		}
	}
	typedefOf(tagname:string) {
		return this.defines[tagname];//.fields;
	}
	getSectionStart(name:string){
		const at=this.header.sectionnames.indexOf(name);
		if (~at) {
			return this.header.sectionstarts[at];
		}
		return -1
	}
	getSectionName(line:number){
		const at=bsearchNumber(this.header.sectionstarts, line+1)-1;
		return this.header.sectionnames[at];
	}
}