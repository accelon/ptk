import {IField} from './interfaces.ts'
export class Field implements IField {
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
		this.bracket=[]; //bracket text          
		this.sortedIndex; 

		for (let n in def) {
			if (!this.hasOwnProperty(n)) {
				console.log('unknown defining attr',n,'of',name,def)
			}
			this[n]=def[n];
		}
		if (def.unique) this.unique={};
	}
	validate(value){
		return [0,value];
	}
	find(){
		return -1;
	}
}
