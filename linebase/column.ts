/* store in column oriented */ 
import {bsearch} from "../utils/bsearch.ts";
import {pack_delta2d,pack} from "../utils/packintarray.ts"
import {packStrings} from "../utils/packstr.ts"
export class Column {
	constructor(typedef) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.typedef=[];
		this.lemmas=[];
		for (let name in typedef) {
			this.addColumn( name,typedef[name]);
			this.typedef.push(typedef[name])
		}
	}
	//lexicon :: lemma(sorted primary key) = payload
	addColumn(name,type:string){
		this.fieldnames.push(name)
		this.fieldvalues.push( []);
	}
	validate(cell, type) {
		if (type=='number' || type=='unique_number')  {
			if (parseInt(cell).toString()!==cell) throw "type missmatch "
			return parseInt(cell)
		}  else if (type=='lemmalist') {
			const lemmas=cell.split(',');
			return lemmas.map(it=> {
				if (!it) return null;
				const at=bsearch(this.lemmas, it);
				if (this.lemmas[at]===it) {
					return at+1;
				} else {
					console.log('it',it)
					throw "lemma not found"
				}
			}).filter(it=>!!it).sort((a,b)=>a-b)
		}
		return cell;
	//sharing code with offtext validator
	}
	addLine(payload:string[], line:number ){
		for (let i=0;i<payload.length;i++) {
			const v=this.validate(payload[i],  this.typedef[i]);
			this.fieldvalues[ i ].push( v );
		}
	}
	fromLexicon(buffer:(string|string[])){
		const lines=Array.isArray(buffer)?buffer:buffer.split(/\r?\n/);

		for (let i=0;i<lines.length;i++) {
			const line=lines[i];
			const at=line.indexOf('=');
			if (at==-1) throw "invalid lexicon, need = , at line "+ (i+1)
			const lemma=line.slice(0,at);
			this.lemmas.push(lemma);
		}
		//second pass, not changing lines, faster
		for (let i=0;i<lines.length;i++) {
			const line=lines[i];
			const at=line.indexOf('=');
			const payload=line.slice(at+1).split('\t');
			this.addLine(payload, i+1 ) ; //one base
		}
		const out=[packStrings(this.lemmas)];
		for (let i=0;i<this.fieldnames.length;i++) {
			const type=this.typedef[i];
			if (type=='number' || type=='unique_number') {
				out.push(pack( this.fieldvalues[i]));
			} else if (type=='lemmalist') {
				out.push(pack_delta2d(this.fieldvalues[i]));
			}
  		}
		return out.join('\n');
	}
}
