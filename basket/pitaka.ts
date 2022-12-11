import {ILineBase,LineBase,Column} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {unpackIntDelta,bsearchNumber} from '../utils/index.ts';
import {rangeOfAddress,captionOfAddress} from './address.ts';
import {columnField,inlineNote,rowOf,scanPrimaryKeys} from './columns.ts';
import {Inverted,plContain} from '../fts/index.ts';
import {TableOfContent} from '../compiler/toc.ts';
import {parseQuery,scanText} from '../fts/query.ts';
import {footNoteAddress,footNoteByAddress} from './footnote.ts';

export const regPtkName =  /^[a-z\-_]{2,16}$/
export const validPtkName=(name:string):boolean=>!!name.match(regPtkName);
export interface IPitaka extends ILineBase{
	columns:Map<string,any>,
	typedefOf:Function,
	inlineNote:Function,
	columnField:Function,
}
export class Pitaka extends LineBase {
	defines:Record<string,unknown>
	constructor(opts){
		super(opts);
		this.defines={};
		this.primarykeys={};
		this.columns={};
		this.tocs={};
		this.rangeOfAddress=rangeOfAddress;
		this.captionOfAddress=captionOfAddress;
		this.scanPrimaryKeys=scanPrimaryKeys;
		this.scanText=scanText;
		this.parseQuery=parseQuery;
		this.scanCache={};
		this.queryCache={};
		this.columnField=columnField;
		this.inlineNote=inlineNote;
		this.footNoteAddress=footNoteAddress;
		this.footNoteByAddress=footNoteByAddress;

		this.rowOf=rowOf;
		this.inverted=null;
		this.parallels={}; //parallels showing flag, ptkname:string, onoff:boolean
		this.lang='';
	}
	async init(){
		if (!this.payload) return;
		const compiler=new Compiler();
		compiler.compileBuffer(this.payload, this.name);
		this.defines=compiler.typedefs;
		this.attributes=compiler.compiledFiles[this.name]?.attributes;
		this.lang=this.attributes.lang||'zh';
		const ranges=[];
		for (let i=0;i<this.header.preload.length;i++) {
			const r=this.sectionRange(this.header.preload[i]);
			if (r&&r[1]>r[0])	 ranges.push(r);
		}
		
		for (let n in this.defines) {
			if (this.defines[n].fields.preload) {
				const r=this.sectionRange('^'+n);
				if (r&&r[1]>r[0]) ranges.push(r);
			}
		}
		//load together , avoid duplicate jobs
		
		await this.loadLines(ranges);	
		

		//todo , need to preload ck tag

		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			if (section.length)	this.deserialize(section);
			// else console.error('empty section',this.header.preload[i]);
		}
		for (const n in this.defines) { //see compiler/typedef.ts serialize()
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
		//link column and define
		for (const n in this.columns) {
			const tagname=(this.columns[n].attrs?.tagname)
			if (tagname){
				this.defines[tagname].column=n;
			}
		}
	}
	deserialize(section) {	
		if (!section.length) return;
		if (!section[0]) section.shift();
		if (!section.length) return;
		const firstline=section[0];
		const {sourcetype,name}=sourceType(firstline);
		if (sourcetype==='tsv') {
			const column=new Column();
			column.deserialize(section);
			this.columns[column.name]=column;
			this.primarykeys[column.name]=column.keys;
		} else if (sourcetype==='tokens') {
			section.shift();
			const postingstart=this.sectionRange('_postings')[0];
			this.inverted=new Inverted(section,postingstart);
		} else if (sourcetype==='toc') {
			section.shift();
			this.tocs[ name|| '*'] = new TableOfContent(section,name);
		}
	}
	async loadPostings(s:string){
		if (!this.inverted) return;
		const nPostings=this.inverted.nPostingOf(s);
		const jobs=[];
		const that=this;
		for (let i=0;i<nPostings.length;i++) {
			if (nPostings[i]<0) continue;
			const line=this.inverted.postingStart+nPostings[i];
			jobs.push( async function(at){
				await that.loadLines([[line,line+1]]);
				that.inverted.postings[at]=unpackIntDelta(that.getLine(line));
			}(nPostings[i]));
		}
		await Promise.all(jobs);
		return this.getPostings(s);
	}
	getHeading(line:number) {
		if (!line) return '';
		const chunktag=this.defines.ck;
		const at=bsearchNumber(chunktag.linepos, line)-1;
		const lineoff=line-chunktag.linepos[at];
		let caption=chunktag.innertext.get(at);
		const id=chunktag.fields?.id?.values[at];
/* TODO
if caption has leading - , trace back to fetch ancestor node,
this is suitable for tree structure with less branches,
not suitable for dictionary wordheads
*/

		if (!caption) {
			caption=this.columns[chunktag.column]?.keys?.get(id);			
		}
		return {id, tagname:'ck', caption,lineoff};
	}
	getPostings(s:string){
		const nPostings=this.inverted.nPostingOf(s);
		const postings=this.inverted.postings;
		return nPostings.map( np=> postings[np] );
	}
	getNearestTag(line,tag){
		const linepos=this.defines[tag]?.linepos;
		if (!linepos) return null;
		return bsearchNumber(linepos,line) ||-1;
	}
	getNearestChunk( line) {
		const chunktag=this.defines.ck;
		const booktag=this.defines.bk;
		const at=this.getNearestTag(line,chunktag)-1;
		if (at<0) return null;
		const bkat=this.getNearestTag(line,'bk')-1;

		return {bkid:booktag.fields.id.values[bkat] ,
			at, id:chunktag.fields.id.values[at], innertext: chunktag.innertext.get(at)}
	}
	findClosestTag(typedef, key, value, from=0){
		let at=typedef.fields[key].values.indexOf(value);
		while (at>=0 && typedef.linepos[at]<from) {
			at=typedef.fields[key].values.indexOf(value, at+1);
		}
		return at;
	}
	postingLine(posting:number[]){
		return plContain(posting,this.inverted.tokenlinepos)[0];
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
	humanName(short:true,lang='zh'){
		let n= this.attributes[lang]||this.name;
		const at=n.indexOf('|');
		if (at==-1) return n;

		return short?n.slice(0,at):n.slice(at+1);
	}
	getParallelLine(masterptk,line){
		return [true,0];
	}
}