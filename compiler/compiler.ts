import {Compiler} from './compiled.ts'
import {parseOfftext,Offtext,updateOfftext}  from '../offtext/parser.ts';
import {Column} from '../linebase/column.ts'
import {SourceType,ICompiledFile,ICompiled} from './interfaces.ts'
import {validate_z} from './fielder.ts'
import {StringArray} from '../utils/stringarray.ts'
import {Typedef} from './typedef.ts'
import {VError,MAX_VERROR} from './error.ts'
import {predefines} from './predefines.ts'

export const sourceType=(firstline:string):SourceType=>{	
	const at=firstline.indexOf('\n');
	firstline=at>-1? firstline.slice(0,at):firstline;
	const [text,tags]=parseOfftext(firstline);
	let preload=false ,sourcetype, name,caption;
	let consumed=false;
	if (tags.length && tags[0].name==':') { //directive
		const attrs=tags[0].attrs;
		preload=!!tags[0].attrs.preload;
		sourcetype=tags[0].attrs.type;
		name=tags[0].attrs.name;
		caption=tags[0].attrs.caption;
		if (attrs?.type?.toLowerCase()=='tsv') {
			return {sourcetype:SourceType.TSV, tag:tags[0], preload ,name,caption,consumed:false};
		}
		consumed=true;  //combined all consumed ^: lines and put to 000.js payaload
	}
	return {sourcetype:sourcetype||SourceType.Offtext,tag:tags[0],preload,name,caption,consumed};
}
export class CompiledFile implements ICompiledFile {
	constructor (){
		this.errors=[];
		this.tagdefs=[];
		this.processed;
		this.sourcetype='';
	}
}
export class Compiler implements ICompiler {
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
		//for z tag
		this.toc=[];
		this.zcount=0;
		this.prevzline=0;
		this.prevdepth=0;
		this.tagdefs=[]; // defines provided by the library, will be added to 000.js payload
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
		if (at==-1) return str;
		const ot=new Offtext(str);
		let updated=false ;
		for (let i=0;i<ot.tags.length;i++) {
			const tag=ot.tags[i];
			if (tag.name[0]==':' && tag.name.length>1) {
				const newtagname=tag.name.slice(1);
				if (this.typedefs[newtagname]) {
					this.onError(VError.TypeRedef, newtagname)
				} else {
					this.typedefs[newtagname]= new Typedef(tag.attrs,newtagname,this.primarykeys);
				}
				tagdefs.push(str);
				str=null;  //no in source tag
			} else {
				if (tag.name[0]=='z') {
					validate_z.call(this,ot,tag);
				} else {
					const typedef=this.typedefs[tag.name];
					if (!typedef) {
						this.onError(VError.MissingTypedef, tag.name);
					} else {
						const newtag=typedef.validateTag(ot,tag , this.line,this.compiledLine,this.onError.bind(this));
						if (newtag) {
							str=updateOfftext(str,tag,newtag);
							updated=true;
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
		let processed,samepage=false, tagdefs=[] , attributes={};
		const sa=new StringArray(buffer,{sequencial:true});
		const firstline=sa.first();
		const {sourcetype,tag,preload,name,caption,consumed}=sourceType(firstline); //only first tag on first line
		if (sourcetype=='txt' && consumed) tagdefs.push(firstline);
		let compiledname = name || filename;//name of this section
		let textstart=0;//starting line of indexable text
		this.compilingname=filename;
		this.stopcompile=false;
		
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
			//if (!tag.attrs.type) 
			if (filename==='0.off') this.setPredefine(tag.attrs.define);
			attributes=tag.attrs;
		}
		if (sourcetype===SourceType.TSV) {
			const [text,tags]=parseOfftext(firstline);
			const attrs=tags[0].attrs;
			const typedef=text.split('\t') ; // typdef of each field , except field 0
			const columns=new Column( {typedef, primarykeys:this.primarykeys ,onError:this.onError.bind(this) } );
			const [serialized,_textstart]=columns.fromStringArray(sa,attrs,1) ; //build from TSV, start from line 1
			textstart=_textstart;
			if (serialized) {
				compiledname = attrs.name || filename;  //use filename if name is not specified
				serialized.unshift(firstline); //keep the first line
				//primary key can be refered by other tsv
				if (attrs.name) this.primarykeys[attrs.name]= columns.keys;
				this.compiledLine += serialized.length;
				processed=serialized;
				textstart++; //add the first line
				samepage=true; //store in same page
			} else {
				processed=[];
			}
		} else {
			const out=[];
			let linetext=sa.first();
			if (consumed) linetext=sa.next();
			this.line=0;
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
		}
		this.compiledFiles[filename]={name:compiledname,caption,preload,sourcetype,processed,textstart,
			errors:this.errors,samepage,tagdefs, attributes};
		return this.compiledFiles[filename];
	}
}