import {Compiler} from './compiled.ts'
import {parseOfftext}  from '../offtext/parser.ts';
import {Column} from '../linebase/column.ts'
import {SourceType,ICompiledFile,ICompiled} from './interfaces.ts'

const sourceType=(firstline:string):SourceType=>{
	const at=firstline.indexOf('\n');
	firstline=at>-1? firstline.slice(0,at):firstline;
	const [text,tags]=parseOfftext(firstline);
	if (tags[0].name=='_') { //define a section
		const attrs=tags[0].attrs;
		if (attrs?.type?.toLowerCase()=='tsv') {
			return [SourceType.TSV, tags[0]];
		}
	}
	return [SourceType.Offtext,tags[0]];
}
export class CompiledFile implements ICompiledFile {
	constructor (){
		this.errors=[];
		this.processed='';
	}
}

export class Compiler implements ICompiler {
	constructor () {
		this.ptkname='';
		this.compilingname='';
		this.line=0;
		this.compiledFiles={};
		this.primarykeys={};
		this.errors=[];
	}
	onError(msg, line, refline=0) {
		this.errors.push({name:this.compilingname, line:line||this.line, msg, refline});
	}	
	compileBuffer(buffer:string,filename:string) {
		if (!buffer) return this.onError('empty buffer');
		if (!filename) return this.onError('no name');
		let processed='',samepage=false;
		const lines= (typeof buffer=='string') ?buffer.split(/\r?\n/):buffer;
		const [srctype,tag]=sourceType(lines[0]); //only first tag on first line
		let name=filename;//name of this section
		if (tag.name=='_') { //system directive
			if (tag.attrs.ptk) {
				if (this.ptkname && this.ptkname!==tag.attrs.ptk) {
					this.onError('ptk already named '+this.ptkname);
				} else {
					this.ptkname=tag.attrs.ptk;
				}
			}
		}
		if (srctype===SourceType.TSV) {
			const [text,tags]=parseOfftext(lines[0]);
			const attrs=tags[0].attrs;
			const typedef=text.split('\t') ; // typdef of each field , except field 0
			const columns=new Column(attrs, {typedef, primarykeys:this.primarykeys ,onError:this.onError.bind(this) } );
			const header=lines.shift();
			const serialized=columns.fromTSV(lines ) ; //build from TSV
			name = attrs.name || filename;  //use filename if name is not specified
			serialized.unshift(header); //keep the first line
			//primary key can be refered by other tsv
			if (attrs.name) this.primarykeys[attrs.name]= columns.keys;
			processed=serialized;
			samepage=true;
		} else {
			processed=buffer;
		}
		this.compiledFiles[filename]={name,processed,errors:this.errors,samepage};
		return this.compiledFiles[filename];
	}
}