export enum SourceType { Offtext='txt', TSV='tsv' ,Unknown='unknown' };

export interface ICompileError {
	fatality:boolean;
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

export interface IField {
	find:Function,
	validate:Function,
}
