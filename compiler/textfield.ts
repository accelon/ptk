import {Field} from './basefield.ts'
export class TextField extends Field { //multiline 
	constructor(name:string,def:Map){
		super(name,def);
		this.type='text';
	}
}