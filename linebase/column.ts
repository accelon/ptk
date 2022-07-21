/* store in column oriented */ 
import {LEMMA_DELIMETER,StringArray,alphabetically0,packIntDelta2d,unpackIntDelta2d,packInt,unpackIntDelta,unpackInt} from "../utils/index.ts"
import {createValidator,VError} from  "../compiler/index.ts"
import {parseOfftext} from '../offtext/index.ts'
export class Column {
	constructor(opts={}) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.validators=[];
		this.name='';
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
			this.onError&&this.onError(VError.ExcessiveField, fields.length+ ' max '+this.validators.length,line);
			return;
		}
		for (let i=0;i<fields.length;i++) {
			const V=this.validators[i];
			const [err,value]=V.validate(fields[i],line);
			if (err) {
				this.onError&&this.onError(err,this.fieldnames[i]+' '+fields[i],-1,line);
			}
			this.fieldvalues[i].push( value);
		}
	}
	createValidators(typedef){
		if (typedef) for (let idx in typedef) {
			if (idx==0 && !typedef[idx]) continue; //primary key
			const [name,def]=typedef[idx].split('=');
			this.addColumn(name);
			const V= createValidator(name,def||{} , this.primarykeys , this.keys);
			this.validators.push(V);
		}
	}
	deserialize(section:string[]){
		const firstline=section.shift();
		const [text,tags]=parseOfftext(firstline);
		const attrs=tags[0].attrs;
		this.name=attrs.name;
		const typedef=text.split('\t') ; // typdef of each field , except field 0
		this.createValidators(typedef);
		this.keys=new StringArray(section.shift(),{delimiter:LEMMA_DELIMETER});  //local keys
		let idx=0;
		for (let fieldname in this.validators) {
			const field=this.validators[fieldname];
			const linetext=section.shift();
			if (field.type==='number') {
				this.fieldvalues[idx]=unpackInt(linetext);
			} else if (field.type==='keys') {
				this.fieldvalues[idx]=unpackIntDelta2d(linetext);
			}
			idx++;
		}
		if (section.length) {
			console.log('section not consumed');
		}
	}
	fromStringArray(sa:StringArray, from=1):string[]{
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
				const numbers=this.fieldvalues[i].map(it=>parseInt(it)||0)||[];
				out.push(packInt( numbers));
			} else if (V.type=='keys') {
				const nums=(this.fieldvalues[i])||[];
				out.push(packIntDelta2d(nums));
			} else if (V.type){
				this.onError&&this.onError(VError.UnknownType,V.type);
			}
  		}
		return out;
	}
	fromTSV(buffer:string, from=1):string[]{
		const sa=new StringArray(buffer,{sequencial:true});
		return this.fromStringArray(sa,from);
	}
}
