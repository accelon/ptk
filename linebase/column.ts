/* store in column oriented */ 
import {bsearch} from "../utils/bsearch.ts";
import {pack_delta2d,pack} from "../utils/packintarray.ts"
import {packStrings} from "../utils/packstr.ts"
import {alphabetically0} from "../utils/sortedarray.ts"
export class Column {
	constructor(typedef) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.typedef=[];
		this.keys=[];  //keys
		this.values=[]; // 
		for (let name in typedef) {
			if (name[0]=='_') {
				const nm=name.slice(1);
				this.addColumn( nm,typedef[name]);
				this.typedef.push(typedef[name])	
			}
		}
	}
	//lexicon :: key(sorted primary key) = payload
	addColumn(name,type:string){
		this.fieldnames.push(name)
		this.fieldvalues.push( []);
	}
	validate(cell, type) {
		if (type=='number' || type=='unique_number')  {
			if (parseInt(cell).toString()!==cell) {
				console.log(cell,'is not',type)
				throw "type missmatch "
			}
			return parseInt(cell);
		}  else if (type=='keys') {
			const keys=cell.split(',');
			return keys.map(it=> {
				if (!it) return null;
				const at=bsearch(this.keys, it);
				if (this.keys[at]===it) {
					return at+1;
				} else {
					throw "key not found"
				}
			}).filter(it=>!!it).sort((a,b)=>a-b)
		}
		return cell;
	//sharing code with offtext validator
	}
	addLine(payload:string[], line:number ){
		for (let i=0;i<payload.length;i++) {
			const v=this.validate( payload[i],  this.typedef[i]);
			this.fieldvalues[ i ].push( v );
		}
	}
	fromLexicon(buffer:(string|string[])):string[]{
		const keyvalues=[];
		const lines=Array.isArray(buffer)?buffer:buffer.split(/\r?\n/);
		
		for (let i=0;i<lines.length;i++) {
			const line=lines[i];

			const at=line.indexOf('=');
			if (at==-1) throw "invalid lexicon, need = , at line "+ (i+1)
			const key=line.slice(0,at);
			const payload=line.slice(at+1);
			keyvalues.push([key,payload]);
		}
		keyvalues.sort(alphabetically0)
		this.keys=keyvalues.map(it=>it[0]);
		this.values=keyvalues.map(it=>it[1]);

		if (!this.fieldnames.length)  return; // no type def

		//second pass, not changing lines, faster
		for (let i=0;i<this.values.length;i++) {
			const payload=this.values[i].split('\t');
			this.addLine(payload, i+1 ) ; //one base
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
