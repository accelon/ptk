import {IField} from './interfaces.ts'
import {VError} from './error.ts';
export class Field implements IField {
	type:string
	name:string
	foreign:string
	optional:boolean
	unique:boolean
	caption:string
	constructor(name:string,def:Map){
		this.name=name;
		this.foreign=def.foreign||'';
		this.pattern=def.pattern||null;//regex pattern
		this.keys=def.keys||[];
		this.unique=null;
		this.optional=true;
		this.caption='';
		this.type=def.type||'string';

		this.values=[] ; //number or string value, runtime only
		this.sortedIndex; 

		for (let n in def) {
			if (!this.hasOwnProperty(n)) {
				console.log('unknown defining attr',n,'of',name,def)
			}
			this[n]=def[n];
		}
		if (def.unique) this.unique={};
	}
	resetUnique(){
		if (this.unique) this.unique={};
	}
	validate(value:string,line:number){
		if (this.unique) {
			if (this.unique[value]) { //found in this line, cannot be zero
				return [VError.NotUnique, 'tag:'+this.name+', value:'+value, this.unique[value] ]; //send ref line
			} else {
				this.unique[value]=line; //first occurance
			}
		}
		return [0,value];
	}
	find(){
		return -1;
	}
}
