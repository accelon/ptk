import {LineBase} from './linebase.ts'
import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'

export class JsonpLineBase extends LineBase {
	constructor(){
		super();
	}
	makePageJsonp(name,page,start,payload){
		return 'jsonp(1,{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
	}
	makeHeader(name){
		const header=Object.assign(this.header , {name,starts:this.pages,buildtime:new Date()})
		return 'jsonp(0,'+JSON.stringify(header)+')';
	}
	write(name , cb) {
		if (this.sealed) throw 'already sealed';
		this.seal();
		let start=0;
		writeChanged(pagejsonpfn(0,name), this.makeHeader(name));
		for (let i=0;i<this.pages.length;i++) {
			const lines=this._data.slice(start,this.pages[i]);
			const towrite=this.makePageJsonp(name,i,start,escapeTemplateString(lines.join('\n')));
			const outfn=pagejsonpfn(i+1,name);
			const written=writeChanged(pagejsonpfn(i+1,name), towrite , 'utf8');
			cb&&cb({page:i, written});
			start=this.pages[i]
		}
		return {pagecount:this.pages.length+1}
	}
	async load() {

	}
}