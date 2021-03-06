import {Compiler} from './compiled.ts'
import {parseOfftext,Offtext,updateOfftext}  from '../offtext/parser.ts';
import {Column} from '../linebase/column.ts'
import {SourceType,ICompiledFile,ICompiled} from './interfaces.ts'
import {validate_z} from './fielder.ts'
import {StringArray} from '../utils/stringarray.ts'
import {Typedef} from './typedef.ts'
import {VError,MAX_VERROR} from './error.ts'
export const sourceType=(firstline:string):SourceType=>{	
	const at=firstline.indexOf('\n');
	firstline=at>-1? firstline.slice(0,at):firstline;
	const [text,tags]=parseOfftext(firstline);
	let preload=false;
	if (tags[0].name=='_') { //define a section
		const attrs=tags[0].attrs;
		preload=!!tags[0].attrs.preload;
		chunktag=tags[0].attrs.chunktag||'ck';
		if (attrs?.type?.toLowerCase()=='tsv') {
			return [SourceType.TSV, tags[0], preload, chunktag];
		}
	}
	return [SourceType.Offtext,tags[0],preload, chunktag];
}
export class CompiledFile implements ICompiledFile {
	constructor (){
		this.errors=[];
		this.defines=[];
		this.processed='';
		this.sourcetype='';
	}
}
export class Compiler implements ICompiler {
	constructor () {
		this.reset();
	}
	reset(){
		this.ptkname='';
		this.chunktag='';
		this.compilingname='';
		this.line=0;
		this.compiledLine=0;
		this.compiledFiles={};
		this.primarykeys={};
		this.errors=[];
		this.typedefs={}; 
		this.stopcompile=false;
	}
	onError(code:VError, msg:string,  refline=-1, line:number) {
		this.errors.push({name:this.compilingname, line:(line||this.line), code, msg, refline});
		if (this.errors.length>=MAX_VERROR) this.stopcompile=true;
	}
	compileOfftext(str:string, defines:string[]){
		const at=str.indexOf('^');
		if (at==-1) return str;
		const ot=new Offtext(str);
		let tagtouched=false, updated=false ;
		for (let i=0;i<ot.tags.length;i++) {
			const tag=ot.tags[i]
			if (tag.name[0]==':') {
				const newtagname=tag.name.slice(1);
				if (this.typedefs[newtagname]) {
					this.onError(Verror.TypeRedef, newtagname)
				} else {
					this.typedefs[newtagname]= new Typedef(tag.attrs,newtagname,this.primarykeys);
				}
				defines.push(str);
				str=null;  //no in source tag
			} else {
				if (tag.name[0]=='z') {
					validate_z.call(this,tag);
				} else {
					const typedef=this.typedefs[tag.name];
					if (!typedef) {
						this.onError(VError.MissingTypedef, tag.name);
					} else {
						const newtag=typedef.validateTag(tag , this.line,this.compiledLine,this.onError.bind(this));
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
	compileBuffer(buffer:string,filename:string) {
		if (!buffer)   return this.onError(VError.Empty);
		if (!filename) return this.onError(VError.PtkNoName);
		let processed='',samepage=false, defines=[] , attributes={};
		const sa=new StringArray(buffer,{sequencial:true});
		const firstline=sa.first();
		const [sourcetype,tag,preload,chunktag]=sourceType(firstline); //only first tag on first line
		if (sourcetype=='txt') defines.push(firstline);
		let name=filename;//name of this section
		let textstart=0;//starting line of indexable text
		this.compilingname=filename;
		this.stopcompile=false;

		if (tag.name=='_') { //global setting
			if (tag.attrs.ptk) {
				if (this.ptkname && this.ptkname!==tag.attrs.ptk) {
					this.onError(VError.PtkNamed, this.ptkname);
				} else {
					this.ptkname=tag.attrs.ptk;
				}
			}
			if (tag.attrs.chunktag) {
				if (this.chunktag && this.chunktag!==tag.attrs.chunktag) {
					this.onError(VError.RedefineChunkTag, this.chunktag);
				} else {
					this.chunktag=tag.attrs.chunktag;
				}
			}
			attributes=tag.attrs;
		}
		if (sourcetype===SourceType.TSV) {
			const [text,tags]=parseOfftext(firstline);
			const attrs=tags[0].attrs;
			const typedef=text.split('\t') ; // typdef of each field , except field 0
			const columns=new Column( {typedef, primarykeys:this.primarykeys ,onError:this.onError.bind(this) } );
			const [serialized,_textstart]=columns.fromStringArray(sa,1) ; //build from TSV, start from line 1
			textstart=_textstart;
			if (serialized) {
				name = attrs.name || filename;  //use filename if name is not specified
				serialized.unshift(firstline); //keep the first line
				//primary key can be refered by other tsv
				if (attrs.name) this.primarykeys[attrs.name]= columns.keys;
				this.compiledLine += serialized.length;
				processed=serialized.join('\n');
				samepage=true; //store in same page
			} else {
				processed='';
			}
		} else {
			const out=[];
			let linetext=sa.next();
			this.line=0;
			while (linetext || linetext==='') {
				const o=this.compileOfftext(linetext, defines);
				if (o || o=='') {
					out.push(o);
					this.line++;
				}
				linetext=sa.next();
				if (this.stopcompile) break;
			}
			this.compiledLine += out.length;
			processed=out.join('\n');
		}
		this.compiledFiles[filename]={name,preload,sourcetype,processed,textstart,
			errors:this.errors,samepage,defines, attributes};
		return this.compiledFiles[filename];
	}
}