/* store in column oriented */ 
import {packIntDelta2d,packInt} from "../utils/packintarray.ts"
import {LEMMA_DELIMETER,StringArray} from "../utils/stringarray.ts"
import {alphabetically0} from "../utils/sortedarray.ts"
import {createValidator} from  "../compiler/validator.ts"
export class Column {
	constructor(attrs, opts={}) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.validators=[];
		this.keys=[];  //keys
		this.values=[]; // 
		this.primarykeys=opts.primarykeys||{};
		this.onError=opts.onError;
		this.typedef=opts.typedef;
	}
	//lexicon :: key(sorted primary key) = payload
	addColumn(name:string){
		this.fieldnames.push(name)
		this.fieldvalues.push([]);
	}
	addRow(fields:string[], line:number ){
		if (fields.length>this.validators.length && line) {
			this.onError('excessive field '+fields.length+ ' max '+this.validators.length,line);
			return;
		}
		for (let i=0;i<fields.length;i++) {
			const V=this.validators[i];
			const [err,value]=V.validate(fields[i]);
			if (err) {
				this.onError(this.fieldnames[i]+' '+fields[i]+' '+err,line);
			}
			this.fieldvalues[i].push( value);
		}
	}
	createValidators(typedef){
		if (typedef) for (let idx in typedef) {
			if (idx==0 && !typedef[idx]) continue; //primary key
			const [name,def]=typedef[idx].split('=');
			this.addColumn(name);
			const V= createValidator(name,def , this.primarykeys , this.keys);
			this.validators.push(V);
		}
	}
	fromStringArray(sa:StringArray, from=0):string[]{
		const allfields=[];
		let line=sa.first();

		while (from>0) {
			line=sa.next();
			from--;
		}
		while (line || line===''){
			const fields=line.split('\t');
			allfields.push(fields);
			line=sa.next();
		}
		allfields.sort(alphabetically0)
		this.keys=allfields.map(it=>it[0]);
		this.values=allfields.map(it=>it.slice(1));
		this.createValidators(this.typedef);

		if (!this.fieldnames.length)  return; // no type def
		for (let i=0;i<this.values.length;i++) {
			const fields=this.values[i];
			this.addRow(fields, i+1 ) ; //one base
		}
		const out=[this.keys.join(LEMMA_DELIMETER)]; //use StringTable

		for (let i=0;i<this.fieldnames.length;i++) {
			const V=this.validators[i];
			if (V.type=='number') {
				out.push(packInt( this.fieldvalues[i]||[]));
			} else if (V.type=='keys') {
				out.push(packIntDelta2d(this.fieldvalues[i]||[]));
			} else {
				this.onError('unknown type '+V.type);
			}
  		}
		return out;
	}
	fromTSV(buffer:string, from=0):string[]{
		const sa=StringArray(string,{sequencial:true});
		return this.fromStringArray(sa,from);
	}
}
