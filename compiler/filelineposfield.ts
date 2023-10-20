import { packIntDelta } from '../utils/packintarray.js';
import {Field} from './basefield.ts';
import {VError} from './error.ts';
export class FileLinePosField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='filelinepos';
        this.prevfn='';
	}
	validate(value:string,line:number,compiledFiles) {
        const arr=value.split(',');
        const out=[]
        let linestart=0;
        for (let i=0;i<arr.length;i++) {
            const v=parseInt(arr[i]);
            if (isNaN(v)) {
                const f=compiledFiles[arr[i]];
                if (!f) {
                    throw "no such file "+arr[i];
                }
                linestart=f.linestart;
            } else {
                out.push(linestart+v);
            }
        }       
    	return [0,out];
	}
}