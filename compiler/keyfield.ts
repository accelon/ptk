import {Field} from './basefield.ts';
import {VError} from './error.ts';
import {bsearch} from "../utils/bsearch.ts";
export class KeyField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='key';
	}
	validate(value:string,line:number){
		//convert items to key index, try foreign key first, 
		const keys=this.keys;
		if (!keys) return [VError.NoKeys,value];
		if (!value) { //empty value, validate pass if optional
			return [this.optional?0:VError.Mandatory,[]];
		}
		const at=bsearch(keys, value);
		if (keys[at]!==value){
			return [VError.NoKey,[]]
		} else {
			return [0,at];
		}
	}	
}