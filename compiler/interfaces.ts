
export enum SourceType { Offtext=1, TSV=2 };

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
	errors:ICompileError[],
}
export interface ICompiler {
	ptk:string;   
	compilingname:string; 
	line:number;
	primarykeys:Map<string,any>,
	compiledFiles:Map<string,ICompiled>,
}