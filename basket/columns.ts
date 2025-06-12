import {indexOfs} from '../utils/array.ts';
import {fromSim} from '../lossless-simplified-chinese';

export function columnField(name:string, field:string, idx:number) {
	const column=this.columns[name];
	const at=column.fieldnames.indexOf(field);
	return column.fieldvalues[at][idx];
}

export async function inlineNote(tagname:string,noteid:string){
	const typedef=this.defines[tagname];
	const col=this.columns[typedef.fields.type.foreign];
	if (!col) return;
	const at=col.findKey(noteid);
	const textfield=typedef.attrs.text;
	const at2=col.fieldnames.indexOf(textfield);
	//can await in the future
	const values=col.fieldvalues[at2];
	return (values&&values[at])||'';
}
export function rowOf(rowname:string,idx:number,field=-1) {
	const column=this.columns[rowname];
	if (typeof field=='string') {
		field=column.fieldnames.indexOf(field);
	}
	const out=[];
	if (field>0) {
		out.push( { name,typedef:column.fieldsdef[field], value:column.fieldvalues[field][idx] } ) ;
	} else {
		for (let i=0;i<column.fieldnames.length;i++) {
			const name=column.fieldnames[i];
			out.push( { name,typedef:column.fieldsdef[i], value:column.fieldvalues[i][idx] } ) ;
		}
	}
	return out;
}
const getCacheKey=(name,field,tofind)=>{
	return name+':'+field+'='+tofind
}

export function searchColumnField(name,field,tofind) {
	const simtofind=fromSim(tofind);
	let cachekey=getCacheKey(name,field,tofind);
	let cache=this.scanCache[cachekey];
	if (!cache && simtofind!==tofind) {
		cache=this.scanCache[getCacheKey(name,field,simtofind)];
	}
	if (!cache) {
		const array=this.columns[name][field];
		if (!array) {
			console.log('missing field',field,'in column',name);
			return null;
		}
		let contain=indexOfs(array,tofind);
		if (!contain.length && simtofind!==tofind) {
			contain=indexOfs(array,simtofind);
			if (contain.length) {
				cachekey=getCacheKey(name,field,simtofind);
			}
		}
		const caption=this.columns[name].caption||name;
		cache={name,field:field,caption, contain};
		this.scanCache[cachekey]=cache;
	}
	return cache;
}
export function scanColumnFields(tofind:string) {
	const out=[];
	if (!tofind) return [];
	for (let name in this.columns) {		
		if (!this.columns[name].attrs.scan) continue;
		const scans=this.columns[name].attrs.scan.split(",");
		for (let i=0;i<scans.length;i++) {
			const cache=searchColumnField.call(this,name, scans[i],tofind)
			out.push(cache);
		}
	}
	for (let name in this.primarykeys) {
		if (!this.columns[name].attrs.bme) continue;
		const cachekey=name+'='+tofind;
		let cache=this.scanCache[cachekey];
		if (!cache) {
			const sa=this.primarykeys[name];
			const start=sa.enumStart(tofind);
			const middle=sa.enumMiddle(tofind);
			const end=sa.enumEnd(tofind);
			const caption=this.columns[name].caption||name;
			cache={name,caption,start,middle,end};
			this.scanCache[cachekey]=cache;
		}
		out.push(cache);	
	}
	return out;
}


