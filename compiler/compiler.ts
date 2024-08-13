import {parseOfftext,Offtext,updateOfftext}  from '../offtext/parser.ts';
import {Column} from '../linebase/column.ts'
import {SourceType} from './interfaces.ts'
import {validate_z,validate_x,validate_y} from './fielder.ts'
import {StringArray} from '../utils/stringarray.ts'
import {Typedef} from './typedef.ts'
import {VError,MAX_VERROR} from './error.ts'
import {predefines} from './predefines.ts'
import { packInt } from '../utils/packintarray.ts';
import {checkFootnote} from './footnotes.ts';
import {IOfftag} from '../offtext/index.ts'
export const sourceType=(firstline:string,filename:string='')=>{	
	const at=firstline.indexOf('\n');
	let lazy=true , name='',caption='',tag:IOfftag;
	let consumed=false;
	let sourcetype=SourceType.Unknown;
	if (filename) {
		if (filename.endsWith('.tsv'))  sourcetype=SourceType.TSV;
		if (filename.endsWith('.off'))  sourcetype=SourceType.Offtext;
	}

	firstline=at>-1? firstline.slice(0,at):firstline;
	const [text,tags]=parseOfftext(firstline);	
	if (tags.length && tags[0].name==':') { //directive
		const attrs=tags[0].attrs;
		if (attrs.hasOwnProperty("lazy")) lazy=!!attrs.lazy;
		sourcetype=tags[0].attrs.type?.toLowerCase()||sourcetype;
		name=attrs.name;
		caption=attrs.caption;
		consumed=true;
		if (sourcetype=='tsv') {
			consumed=false;
			lazy=false;
		}
		tag=tags[0]
	}
	// console.log(filename,sourcetype);
	return {sourcetype,tag,lazy,name,caption,consumed};
}
export class CompiledFile{
	errors:Array<string>
	tagdefs:Array<any>
	processed:Array<string>
	sourcetype:string
	constructor (){
		this.errors=[];
		this.tagdefs=[];
		this.processed;
		this.sourcetype='';
	}
}
export class Compiler implements ICompiler {
	typedefs:Record<string,any>;
	ptkname:string;
	compilingname:string;
	line:number;
	compiledLine:number;
	compiledFiles:Record<string,any>
	primarykeys:Record<string,any>
	errors:Array<any>
	stopcompile:boolean;
	toc:Array<any>;
	zcount:number;
	prevzline:number;
	prevdepth:number;
	tagdefs:Array<string>
	constructor (opts={}) {
		this.reset(opts);
	}
	reset(opts={}){
		this.ptkname='';
		this.compilingname='';
		this.line=0;
		this.compiledLine=0;
		this.compiledFiles={};
		this.primarykeys={};
		this.errors=[];
		this.typedefs={}; 
		this.stopcompile=false;
		this.tagdefs=[]; // defines provided by the library, will be added to 000.js payload

		//for y tag
		
		//for z tag
		this.toc=[];
		this.zcount=0;
		this.prevzline=0;
		this.prevdepth=0;
	}
	onError(code:VError, msg:string,  refline=-1, line:number) {
		this.errors.push({name:this.compilingname, line:(line||this.line), code, msg, refline});
		if (this.errors.length>=MAX_VERROR) this.stopcompile=true;
	}
	setPredefine(name="generic"){
		const predefine=predefines[name]||'';
		this.compileOfftext	(predefine, this.tagdefs);
	}
	compileOfftext(str:string, tagdefs:string[]){
		const at=str.indexOf('^');
		if (at==-1) return str; //nothing to do
		const ot=new Offtext(str);
		for (let i=0;i<ot.tags.length;i++) {
			const tag=ot.tags[i];
			let tagstr=str.slice(tag.offset,tag.end);
			if (tag.name[0]==':' && tag.name.length>1) {
				const newtagname=tag.name.slice(1);
				//if (this.typedefs[newtagname]) {
					//this.onError(VError.TypeRedef, newtagname);
				//} else {
				//just redefine without warning
					this.typedefs[newtagname]= new Typedef(tag.attrs,newtagname,this.primarykeys, this.typedefs);
				//}
				tagdefs.push(tagstr);
			} else {
				if (tag.name[0]=='z') {
					validate_z.call(this,ot,tag);
				} else if (tag.name[0]=='y') {
					validate_y.call(this,ot,tag);
				} else if (tag.name[0]=='x') {
					validate_x.call(this,ot,tag);
				} else {
					const typedef=this.typedefs[tag.name];
					if (!typedef) {
						console.error('unknown tag\n',str, tag.name)
						//this.onError(VError.TypeTagName);
					} else {
						const newtag=typedef.validateTag(ot,tag , this.line,this.compiledLine,this.compiledFiles, this.onError.bind(this));
						if (newtag) {
							str=updateOfftext(str,tag,newtag);
						}
					}
				}
			}
		}
		return str;
	}
	clearCompiled(filename:string) {
		delete this.compiledFiles[filename];
	}

	compileBuffer(buffer:string,filename:string) {
		if (!buffer)   return this.onError(VError.Empty);
		if (!filename) return this.onError(VError.PtkNoName);
		let samepage=false, tagdefs=Array<string>() , attributes={};
		const sa=new StringArray(buffer,{sequencial:true});
		const firstline=sa.first()||'';
		const {sourcetype,tag,lazy,name,caption,consumed}=sourceType(firstline,filename); //only first tag on first line

		if (sourcetype=='txt' && consumed) tagdefs.push(firstline);
		let compiledname = name || filename;//name of this section
		let textstart=0;//starting line of indexable text
		this.compilingname=filename;
		this.stopcompile=false;
		let processed=Array<string>();
		// if (!tag) console.log(firstline,filename);

		if (tag?.name==':') { // system directive
			if (tag.attrs.ptk) {
				if (this.ptkname && this.ptkname!==tag.attrs.ptk) {
					this.onError(VError.PtkNamed, this.ptkname);
				} else {
					this.ptkname=tag.attrs.ptk;
				}
			} 
			//do not set predefine for tsv
			if (tag.attrs.type==='txt'||filename=='0.off') {
				this.setPredefine(tag.attrs.define||tag.attrs.template);
			}
			attributes=tag.attrs;
		}
		const linestart=this.compiledLine;
		if (sourcetype===SourceType.TSV) {
			const [text,tags]=parseOfftext(firstline);
			// if (!tags.length) {
			// 	throw "invalid tsv, first line must be ^:"
			// }
			const attrs=tags[0]?.attrs||{};
			const typedef=text.split('\t') ; // typdef of each field , except field 0
			const columns=new Column( {typedef, primarykeys:this.primarykeys ,onError:this.onError.bind(this) } );
			const [serialized,_textstart]=columns.fromStringArray(sa,attrs,1,this.compiledFiles) ; //build from TSV, start from line 1
			if (!attrs.hasOwnProperty("nocheck")) {
				checkFootnote.call(this,attrs,columns.keys,filename);
			}
			textstart=_textstart;
			if (serialized) {
				compiledname = attrs?.name || filename;  //use filename if name is not specified
				serialized.unshift(firstline); //keep the first line
				//primary key can be refered by other tsv
				if (attrs?.name) this.primarykeys[attrs.name]= columns.keys;
				this.compiledLine += serialized.length;
				processed=serialized;
				textstart++; //add the first line
				samepage=true; //store in same page
			} else {
				processed=[];
			}
		} else if (sourcetype===SourceType.Offtext) {
			const out=Array<string>();
			let linetext=sa.first();
			if (consumed) linetext=sa.next();
			this.line=0; //for debugging showing line from begining of offtext file
			while (linetext || linetext==='') {
				const o=this.compileOfftext(linetext, tagdefs);
				if (o || o=='') {
					out.push(o);
					this.line++;
				}
				linetext=sa.next();
				if (this.stopcompile) break;
			}
			this.compiledLine += out.length;
			processed=out;
		} else { // unknown type
			if (compiledname.endsWith('.num')) {
				let linetext=sa.first();
				const out=Array<string>();
				while (linetext || linetext==='') {
					const o= packInt(linetext.split(',').map(it=>parseInt(it||'0')));
					out.push(o);
					linetext=sa.next();
					if (this.stopcompile) break;
				}
				this.compiledLine += out.length;
				textstart=out.length; //do not index it
				processed=out;	
			} else {
				throw "unknown extension "+compiledname;
			}
		}
		this.compiledFiles[filename]={name:compiledname,caption,lazy,sourcetype,processed,textstart,
			errors:this.errors,samepage,tagdefs, attributes, linestart };
		return this.compiledFiles[filename];
	}
}