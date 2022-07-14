/* store in column oriented */ 
import {bsearch} from "../utils/bsearch.ts";
import {packIntDelta2d,packInt} from "../utils/packintarray.ts"
import {packStrings} from "../utils/packstr.ts"
import {alphabetically0} from "../utils/sortedarray.ts"
export class Column {
	constructor(attrs, opts={}) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.typedef=[];
		this.pattern=[];   
		this.keys=[];  //keys
		this.values=[]; // 
		this.primarykeys=opts.primarykeys||{};
		this.onError=opts.onError;
		if (opts.typedef) for (let name in opts.typedef) {
			if (name==0 && !opts.typedef[name]) continue; //primary key
			this.addColumn(...opts.typedef[name].split(':'));
			this.addTypedef(opts.typedef[name].replace(/[^:]+:/,''))
		}
	}
	//lexicon :: key(sorted primary key) = payload
	addTypedef(typedef:string){
		const at=typedef.indexOf('/');//see if regex pattern
		let regex;
		if (at>0) {
			let expr=typedef.slice(at+1);
			typedef=typedef.slice(0,at);
			const at2=expr.lastIndexOf('/');
			let reopts='';
			if (at2>0) {
				reopts=expr.slice(at2+1);
				expr=expr.slice(0,at2);
			}
			if (at>0) regex= new RegExp(expr,reopts);
		}
		this.typedef.push(typedef);
		this.pattern.push(regex);
	}
	addColumn(name:string){
		this.fieldnames.push(name)
		this.fieldvalues.push( []);
	}
	validate(fieldname,cell, type,pattern,line) {
		if (type=='number' || type=='unique_number')  {
			if (parseInt(cell).toString()!==cell) {
				this.onError(cell+', is not '+type,line);
				return 0;
			}
			if (pattern && !cell.match(pattern)) {
				this.onError(cell+', pattern miss match',line);
				return 0;
			}
			return parseInt(cell)||0;
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
					return this.onError('key not found '+it, line);
				}
			}).filter(it=>!!it).sort((a,b)=>a-b)
		}
		return cell;
	//sharing code with offtext validator
	}
	addRow(fields:string[], line:number ){
		for (let i=0;i<fields.length;i++) {
			const v=this.validate(this.fieldnames[i], fields[i], this.typedef[i], this.pattern[i],line);
			this.fieldvalues[i].push( v );
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
		for (let i=0;i<this.values.length;i++) {
			const fields=this.values[i];
			this.addRow(fields, i+1 ) ; //one base
		}
		const out=[packStrings(this.keys)];
		for (let i=0;i<this.fieldnames.length;i++) {
			const type=this.typedef[i];
			if (type.startsWith('number') || type.startsWith('unique_number')) {
				out.push(packInt( this.fieldvalues[i]||[]));
			} else if (type=='keys') {
				out.push(packIntDelta2d(this.fieldvalues[i]||[]));
			} else {
				this.onError('unknown type '+type);
			}
  		}
		return out;
	}
}
