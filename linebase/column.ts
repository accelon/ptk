/* store in column oriented */ 
import {bsearch} from "../utils/bsearch.ts";
import {pack_delta2d,pack} from "../utils/packintarray.ts"
import {packStrings} from "../utils/packstr.ts"
import {alphabetically0} from "../utils/sortedarray.ts"
export class Column {
	constructor(attrs, typedef , primarykeys) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.typedef=[];
		this.keys=[];  //keys
		this.values=[]; // 
		this.primarykeys=primarykeys||{};

		for (let name in typedef) {
			if (name==0 && !typedef[name]) continue; //primary key
			this.addColumn(...typedef[name].split(':'));
			this.typedef.push(typedef[name].replace(/[^:]+:/,''))
		}
	}
	//lexicon :: key(sorted primary key) = payload
	addColumn(name,type:string){
		this.fieldnames.push(name)
		this.fieldvalues.push( []);
	}
	validate(fieldname,cell, type) {
		if (type=='number' || type=='unique_number')  {
			if (parseInt(cell).toString()!==cell) {
				console.log(cell,'is not',type)
				throw "type missmatch "
			}
			return parseInt(cell);
		}  else if (type=='keys') {
			const items=cell.split(',');
			//convert items to key index, try foreign key first, 
			const keys=this.primarykeys[fieldname] || this.keys;
			return items.map(it=> {
				if (!it) return null;
				const at=bsearch(keys, it);
				if (keys[at]===it) {
					return at+1;
				} else {
					console.log(fieldname,keys.slice(0,10), it)
					throw "key not found"
				}
			}).filter(it=>!!it).sort((a,b)=>a-b)
		}
		return cell;
	//sharing code with offtext validator
	}
	addRow(fields:string[], line:number ){
		for (let i=0;i<fields.length;i++) {
			const v=this.validate(this.fieldnames[i], fields[i],  this.typedef[i]);
			this.fieldvalues[ i ].push( v );
		}
	}
	fromTSV(buffer:(string|string[])):string[]{
		const allfields=[];
		const lines=Array.isArray(buffer)?buffer:buffer.split(/\r?\n/);
		
		for (let i=0;i<lines.length;i++) {
			const fields=lines[i].split('\t');
			allfields.push(fields);
		}
		allfields.sort(alphabetically0)
		this.keys=allfields.map(it=>it[0]);
		this.values=allfields.map(it=>it.slice(1));

		if (!this.fieldnames.length)  return; // no type def
		console.log(this.fieldnames)
		for (let i=0;i<this.values.length;i++) {
			const fields=this.values[i];
			this.addRow(fields, i+1 ) ; //one base
		}
		
		const out=[packStrings(this.keys)];
		for (let i=0;i<this.fieldnames.length;i++) {
			const type=this.typedef[i];
			if (type=='number' || type=='unique_number') {
				out.push(pack( this.fieldvalues[i]));
			} else if (type=='keys') {
				out.push(pack_delta2d(this.fieldvalues[i]));
			} else {
				console.log('unknown type')
			}
  		}
		return out;
	}
}
