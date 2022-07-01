import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'

const makePageJsonp=(name,page,start,payload)=>{
	return 'jsonp(1,{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
}
const makeHeader=(name,header,pages)=>{
	const meta=Object.assign( {} , header,{name,starts:pages,buildtime:new Date()})
	return 'jsonp(0,'+JSON.stringify(meta)+',``)';
}
export function writePages(cb) {
	if (this.sealed) throw 'already sealed';
	this.newPage();
	this.sealed=true;

	let start=0;
	const jsonpfn=pagejsonpfn(0,this.name);
	cb(jsonpfn, makeHeader(this.name,this.header||{},this.pages) );
	for (let i=0;i<this.pages.length;i++) {
		const lines=this._data.slice(start,this.pages[i]);
		const towrite=makePageJsonp(this.name,i,start,escapeTemplateString(lines.join('\n')));
		const done=cb( pagejsonpfn(i+1,this.name) , towrite);
		if (done) break;
		start=this.pages[i]
	}
}
export function addLine (line:string){
	if (this.sealed) throw ('sealed');
	this._accsize+=line.length;
	if (this._accsize>this.pagesize) this.newPage();
	this._data.push(line);
}
export function addLines(buf:string){
	const lines=buf.split(/\r?\n/);
	this.newPage();
	for (let i=0;i<lines.length;i++) {
		append(lines[i]);
	}
}