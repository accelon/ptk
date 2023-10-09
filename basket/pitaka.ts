import {ILineBase,LineBase,Column} from '../linebase/index.ts';
import {Compiler,sourceType} from '../compiler/index.ts'
import {unpackIntDelta,bsearchNumber} from '../utils/index.ts';
import {rangeOfElementId,tagAtAction,rangeOfAddress,innertext,fetchAddress,fetchAddressExtra} from './address.ts';
import {columnField,inlineNote,rowOf,scanColumnFields,searchColumnField} from './columns.ts';
import {Inverted,plContain} from '../fts/index.ts';
import {TableOfContent,buildTocTag} from '../compiler/toc.ts';
import {parseQuery,scanText,scoreLine} from '../fts/query.ts';
import {footNoteAddress,footNoteByAddress} from './footnote.ts';
import {Templates} from '../compiler/template.ts'
import {foreignLinksAtTag,getParallelBook,getParallelLine,enumParallelsPtk} from './parallel.ts';
import {addBacklinks, addForeignLinks } from './links.ts';
import {getCaption,getBookInfo,caption,nearestChunk,getChunk,neighborChunks} from './chunk.ts'
import { parseOfftext } from '../offtext/parser.js';

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
		this.tagAtAction=tagAtAction; //return tag and relative/absolute at
		this.innertext=innertext;
		this.scanColumnFields=scanColumnFields;
		
		this.searchColumnField=searchColumnField;
		this.scanText=scanText;
		this.parseQuery=parseQuery;
		this.scoreLine=scoreLine;
		this.scanCache={};
		this.queryCache={};
		this.columnField=columnField;
		this.inlineNote=inlineNote;
		this.footNoteAddress=footNoteAddress;
		this.footNoteByAddress=footNoteByAddress;
		this.foreignLinksAtTag=foreignLinksAtTag;
		this.getParallelBook=getParallelBook;
		this.getParallelLine=getParallelLine;
		this.enumParallelsPtk=enumParallelsPtk;
		this.taggedLines={};
		this.foreignlinks={}; 
		this.backlinks={};
		this.rowOf=rowOf;
		this.inverted=null;
		this.parallels={}; //parallels showing flag, ptkname:string, onoff:boolean
		this.lang='';
		this.preprocessor=null;
		this.addForeignLinks=addForeignLinks;
		this.addBacklinks=addBacklinks;
		this.getCaption=getCaption;
		this.caption=caption;
		this.nearestChunk=nearestChunk;
		this.getChunk=getChunk;
		this.neighborChunks=neighborChunks;
		this.fetchAddress=fetchAddress;
		this.fetchAddressExtra=fetchAddressExtra;
	}
	async init(){
		if (!this.payload) return;
		const compiler=new Compiler();

		compiler.compileBuffer(this.payload, '0.off');
		this.defines=compiler.typedefs;
		this.attributes=compiler.compiledFiles['0.off']?.attributes;
		this.lang=this.attributes.lang||'zh';
		this.template=Templates[this.attributes.template]||Templates.generic;
		const ranges=[];

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
		
		await this.loadLines(ranges);	
		
		for (let i=0;i<this.header.preload.length;i++) {
			const section=this.getSection(this.header.preload[i]);
			if (section.length)	this.deserialize(section,this.header.preload[i]);
			// else console.error('empty section',this.header.preload[i]);
		}
		for (const n in this.defines) { //see compiler/typedef.ts serialize()
			if (!this.defines[n].fields.lazy) {
				const section=this.getSection('^'+n);
				if (section && section.length) {
					this.defines[n].deserialize(section,this); //call typedef.ts:deserialize
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

		//build chunk toc
		if (this.attributes.toctag) {
			const toctags=this.attributes.toctag.split(',');
			buildTocTag.call(this,toctags);
		}
	}
	deserialize(section,sectionname) {	
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
		const postinglines=[];
		const that=this;
		for (let i=0;i<nPostings.length;i++) {
			if (nPostings[i]<0) continue;
			const line=this.inverted.postingStart+nPostings[i];
			postinglines.push([line,line+1]);
		}
		//must sort for combineRange
		postinglines.sort((a,b)=>a[0]-b[0])
		await that.loadLines(postinglines);
		
		for (let i=0;i<nPostings.length;i++) {
			const at=nPostings[i];
			if (at==-1) continue;
			const line=this.inverted.postingStart+nPostings[i];
			if (!this.inverted.postings[at]) {
				const packedline=that.getLine(line);
				this.inverted.postings[at]=unpackIntDelta(packedline);
			}
		}
		return this.getPostings(s);
	}
	getHeading(line:number) {
		if (!line) return '';
		const chunktag=this.defines.ck;
		const booktag=this.defines.bk;
		const linepos=chunktag?.linepos||[];
		const at=bsearchNumber(linepos, line+1)-1;
		const lineoff=line-linepos[at];
		const id=chunktag?.fields?.id?.values[at];
		const bkat=this.nearestTag(line+1,booktag);
		const bk=getBookInfo.call(this,bkat);
		const bkid=bk?.id ;
/* TODO
if caption has leading - , trace back to fetch ancestor node,
this is suitable for tree structure with less branches,
not suitable for dictionary wordheads
*/
		const caption=this.caption(at);
		return {id, tagname:'ck', caption,lineoff ,  bk, bkid};
	}
	getPostings(s:string){
		const nPostings=this.inverted.nPostingOf(s);
		const postings=this.inverted.postings;
		return nPostings.map( np=> postings[np] );
	}
	nearestTag(line,tag, fieldname=''){
		if (typeof tag=='string') tag=this.defines[tag];
		if (!tag) return -1;
		const linepos=tag.linepos;
		if (!linepos) return null;
		const at=bsearchNumber(linepos,line)-1;
		const adjustat=(line<linepos[linepos.length-1])?at :at+1;
		if (!fieldname) return adjustat;
		else return tag.fields[fieldname].values[adjustat];
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
	getSectionStart(name){
		const at=this.header.sectionnames.indexOf(name);
		if (~at) {
			return this.header.sectionstarts[at];
		}
		return -1
	}
	getSectionName(line){
		const at=bsearchNumber(this.header.sectionstarts, line+1)-1;
		return this.header.sectionnames[at];
	}
	async fetchTag(ele:string,id:string) {
		const range=rangeOfElementId.call(this,[[ele,id]]);
		if (range.length) {
			const [start,end]=range[0];
			const line=await this.getLine(start);
			const [text,tags]=parseOfftext(line);
			for (let i=0;i<tags.length;i++) {
				if (tags[i].name==ele && tags[i].attrs.id==id) {
					return tags[i]
				}
			}
		}
		return null;
	}
	tagInRange(ele:string,from:number,to:number){
		if (typeof to=='undefined') {
			to=this.header.eot;
		}
		const linepos=this.defines[ele]?.linepos;
		if (!linepos) return [];
		const at=bsearchNumber(linepos, from);
		const at2=bsearchNumber(linepos, to)-1;
		return [at,at2];
	}
}