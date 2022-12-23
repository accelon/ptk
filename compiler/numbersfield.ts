import {Field} from './basefield.ts';
import {VError} from './error.ts';
export class NumbersField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='numbers';
	}
	validate(value:string,line:number) {
        const items=value.split(',');
        const out=[];
        for (let i=0;i<items.length;i++) {
            const v=items[i];
            const n=parseInt(items[i]);
            if (n.toString()!==v && v.length) {
                return [VError.NotANumber , line]; //default to 0
            }
            if (this.pattern && !v.match(this.pattern)) {
                return [VError.Pattern,line];
            }
            out.push(n) ;
        }
		return [0,out];
	}
}