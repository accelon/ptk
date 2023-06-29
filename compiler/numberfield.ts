import {Field} from './basefield.ts';
import {VError} from './error.ts';
import {bsearch,sortNumberArray} from '../utils/index.ts';
export class NumberField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='number';
		this.name=name;
		this.sortedIndex=null;
	}
	_sort(){
		[this.values,this.sortedIndex]=sortNumberArray(this.values);
	}
	find(value:number){
		if (!this.values.length) return -1;
		if (!this.sortedIndex) this._sort();
		const at=bsearch(this.values,value);
		return this.values[at]==value?this.sortedIndex[at]:-1;
	}
	validate(value:string,line:number) {
		const n=parseInt(value);
		if (n.toString()!==value && value?.length) {
			return [VError.NotANumber , line]; //default to 0
		}
		if (this.pattern && !value.match(this.pattern)) {
			return [VError.Pattern,0];
		}
		if (this.unique && n>=0) {
			if (this.unique[value]) { //found in this line, cannot be zero
				return [VError.NotUnique, 'tag:'+this.name+', value:'+value, this.unique[value] ]; //send ref line
			} else {
				this.unique[value]=line; //first occurance
			}
		}
		return [0,parseInt(value)];
	}
}