import {escapeTemplateString,pagejsonpfn} from '../utils/index.ts'

const makePageJsonp=(name,page,start,payload)=>{
	return 'jsonp('+page+',{"name":"'+name+'","start":'+start+'},`'+payload+'`)';
}
const makeHeader=(name,header,pagestarts)=>{
	const meta=Object.assign( {} , header,{name,starts:pagestarts,buildtime:new Date()})
	return 'jsonp(0,'+JSON.stringify(meta)+',``)';
}
export async function writePages(cb) {
	if (this.sealed) throw 'already sealed';
	this.newPage();
	this.sealed=true;
	let start=0;
	const jsonpfn=pagejsonpfn(0);
	await cb(jsonpfn, makeHeader(this.name,this.header||{},this.pagestarts) );
	for (let i=0;i<this.pagestarts.length;i++) {
		const lines=this._data.slice(start,this.pagestarts[i]);
		const towrite=makePageJsonp(this.name,i+1,start,escapeTemplateString(lines.join('\n')));
		const done=await cb( pagejsonpfn(i+1) , towrite);
		if (done) break;
		start=this.pagestarts[i]
	}
}
function addLine (line:string,  nobreak=false){
	if (this.sealed) throw ('sealed');
	this._data.push(line);
	this._accsize+=line.length;
	if (this._accsize>this.pagesize && !nobreak) this.newPage();
}

function addSection(name:string,type=''){
	if (!name) name=(this.header.sectionnames.length+1).toString();
	if (!this.header.sectionnames) {
		this.header.sectionnames=[];
		this.header.sectionstarts=[];
		this.header.sectiontypes=[];
	};
	this.header.sectionnames.push(name);
	this.header.sectionstarts.push(this._data.length)
	this.header.sectiontypes.push(type);
}
export function append(buffer:(string|string[]), opts={}){
	const name=opts.name||'';
	const type=opts.type||'';
	const nobreak=opts.nobreak;
	const newpage=opts.newpage;

	if ((buffer.length+this._accsize>this.pagesize|| newpage) && this._data.length) {
		this.newPage(); //start a new page for big buffer.
	}
	addSection.call(this, name, type );
	const lines=Array.isArray(buffer)?buffer:buffer.split(/\r?\n/);

	for (let i=0;i<lines.length;i++) {
		if (this.onAddLine) {
			const text = this.onAddLine(lines[i], i , name);
			if (typeof text==='string') addLine.call(this,text, nobreak);
		} else {
			addLine.call(this,lines[i]||'', nobreak);
		}
	}
}