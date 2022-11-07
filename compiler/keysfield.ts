import {Field} from './basefield.ts';
import {VError} from './error.ts';
import {bsearch} from "../utils/bsearch.ts";
/* multiple key separated by comma */
export class KeysField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='keys';
	}
	validate(value:string,line:number){
		//convert items to key index, try foreign key first, 
		const keys=this.keys;
		if (!keys) return [VError.NoKeys,value];
		if (!value) { //empty value, validate pass if optional
			return [this.optional?0:VError.Mandatory,[]];
		}
		const items=value.split(',').map(it=> {
			if (!it) return 0;
			const at=bsearch(keys, it);
			if (keys[at]===it) {
				return at;
			} else {
				return -1;
			}
		}).filter(it=>!!it).sort((a,b)=>a-b)
		if (items.filter(it=>it===-1).length) {
			return [VError.NoKey,[]]
		} else {
			return [0,items];
		}
	}	
}