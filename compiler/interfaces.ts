export enum SourceType { Offtext='txt', TSV='tsv'  };

export interface ICompileError {
	fatality:boonlean;
	msg:string;
	line:number;
	refline:number;
	linetext:string;
	name:string;
}
export interface ICompiled {
	name:string;
	processed:string,
	textstart:number,//starting of indexable line
	errors:ICompileError[],
}
export interface ITypedef {
	
}
export interface IField {
	find:Function,
	validate:Function,
}
export interface ICompiler {
	ptk:string;   
	compilingname:string; 
	line:number;
	primarykeys:Map<string,any>,
	compiledFiles:Map<string,ICompiled>,
	typedefs:Map<string,ITypedef>
}