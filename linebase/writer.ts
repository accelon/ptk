import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'

const makePageJsonp=(name,page,start,payload)=>{
	return 'jsonp(1,{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
}
const makeHeader=(name,header,pages)=>{
	const meta=Object.assign( {} , header,{name,starts:pages,buildtime:new Date()})
	return 'jsonp(0,'+JSON.stringify(meta)+',``)';
}
export async function writePages(cb) {
	if (this.sealed) throw 'already sealed';
	this.newPage();
	this.sealed=true;

	let start=0;
	const jsonpfn=pagejsonpfn(0,this.name);
	await cb(jsonpfn, makeHeader(this.name,this.header||{},this.pages) );
	for (let i=0;i<this.pages.length;i++) {
		const lines=this._data.slice(start,this.pages[i]);
		const towrite=makePageJsonp(this.name,i,start,escapeTemplateString(lines.join('\n')));
		const done=await cb( pagejsonpfn(i+1,this.name) , towrite);
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

function addFilename(filename:string){
	if (filename) {
		if (!this.header.filenames) {
			this.header.filenames=[];
			this.header.filestarts=[];
		};
		this.header.filenames.push(filename);
		this.header.filestarts.push(this._data.length)
	}
}
export function addLines(lines:string[], filename:string=''){
	if (this._data.length) this.newPage(); //start a new page
	filename && addFilename.call(this, filename.replace(/[\*]/,''));
	for (let i=0;i<lines.length;i++) {
		this.addLine(lines[i]);
	}
}