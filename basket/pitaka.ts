import {ILineBase,LineBase,Column} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {parseOfftext} from '../offtext/index.ts'
import {StringArray,unpackIntDelta,LEMMA_DELIMETER,bsearchNumber} from '../utils/index.ts';
import {rangeOfAddress} from './address.ts';
import {columnField,inlineNote,rowOf,scanPrimaryKeys} from './columns.ts';
import {Inverted,tokenize,TokenType,plContain} from '../fts/index.ts';
import {parseQuery} from '../fts/query.ts';

export const regPtkName =  /^[a-z]{2,16}$/
export const validPtkName=(name:string):boolean=>!!name.match(regPtkName);
export interface IPitaka extends ILineBase{
	columns:Map<string,any>,
	typedefOf:Function,
	inlineNote:Function,
	columnField:Function,
}
export class Pitaka extends LineBase {
	constructor(opts){
		super(opts);
		this.defines={};
		this.primarykeys={};
		this.columns={};
		this.rangeOfAddress=rangeOfAddress;
		this.scanPrimaryKeys=scanPrimaryKeys;
		this.parseQuery=parseQuery;
		this.scanCache={};
		this.queryCache={};
		this.columnField=columnField;
		this.inlineNote=inlineNote;
		this.rowOf=rowOf;
		this.inverted=null;
	}
	async init(){
		const compiler=new Compiler()
		compiler.compileBuffer(this.payload, this.name);
		this.defines=compiler.typedefs;
		this.attributes=compiler.compiledFiles[this.name]?.attributes;
		const jobs=[],ranges=[];
		for (let i=0;i<this.header.preload.length;i++) {
			ranges.push(this.sectionRange(this.header.preload[i]));
		}
		for (let n in this.defines) {
			if (this.defines[n].fields.preload) {
				ranges.push(this.sectionRange('^'+n));
			}
		}
		//load together , avoid duplicate jobs
		await this.loadLines(ranges);

		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			if (section.length)	this.deserialize(section);
			else console.error('empty section',this.header.preload[i])
		}
		for (let n in this.defines) { //see compiler/typedef.ts serialize()
			if (this.defines[n].fields.preload) {
				const section=this.getSection('^'+n);
				this.defines[n].deserialize(section);
			}
			for (let attr in this.defines[n].fields) {
				const A=this.defines[n].fields[attr];
				if (A.foreign && this.primarykeys[A.foreign]) {
					A.keys=this.primarykeys[A.foreign];
				}
			}
		}
	}
	deserialize(section) {
		if (!section.length) return;
		const firstline=section[0];
		const [srctype]=sourceType(firstline);
		if (srctype=='tsv') {
			const column=new Column();
			column.deserialize(section);
			this.columns[column.name]=column;
			this.primarykeys[column.name]=column.keys;
		} else if (srctype=='tokens') {
			section.shift();
			const postingstart=this.sectionRange('_postings')[0];
			this.inverted=new Inverted(section,postingstart);
		}
	}
	async loadPostings(s:string){
		const nPostings=this.inverted.nPostingOf(s);
		const jobs=[];
		const that=this;
		for (let i=0;i<nPostings.length;i++) {
			const line=this.inverted.postingStart+nPostings[i];
			jobs.push( async function(at){
				await that.loadLines([[line,line+1]]);
				that.inverted.postings[at]=unpackIntDelta(that.getLine(line));
			}(nPostings[i]));
		}
		await Promise.all(jobs);
		return this.getPostings(s);
	}	
	getPostings(s:string){
		const nPostings=this.inverted.nPostingOf(s);
		const postings=this.inverted.postings;
		return nPostings.map( np=> postings[np] );
	}
	postingLine(posting:number[]){
		return plContain(posting,this.inverted.tokenlinepos);
	}
	validId(tagname:string,id:any):boolean {
		const V=this.defines[tagname]?.fields;
		if (!V || !V.id) return false;
		if (V.id.type=='number' && typeof id !=='number') id=parseInt(id);
		return ~V.id.values.indexOf(id);
	}
	typedefOf(tagname:string) {
		return this.defines[tagname];//.fields;
	}
	humanName(lang='zh'){
		return this.attributes[lang]||this.name;
	}
}