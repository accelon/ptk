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
export function scanPrimaryKeys(tofind:string) {
	const out=[];
	if (!tofind) return [];
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
