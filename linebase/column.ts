/* store in column oriented */ 
import {LEMMA_DELIMITER,StringArray,alphabetically0,
	packIntDelta2d,	unpackIntDelta2d,packInt,unpackInt} from "../utils/index.ts"
import {createField,VError} from  "../compiler/index.ts"
import {parseOfftext} from '../offtext/index.ts'
export class Column {
	constructor(opts={}) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.fields=[];
		this.attrs; //raw attributes in ^:<>
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
		if (fields.length>this.fields.length && line) {
			this.onError&&this.onError(VError.ExcessiveField, fields.length+ ' max '+this.fields.length,line);
			return;
		}
		for (let i=0;i<fields.length;i++) {
			const F=this.fields[i];
			const [err,value]=F.validate(fields[i],line);
			if (err) {
				this.onError&&this.onError(err,this.fieldnames[i]+' '+fields[i],-1,line);
			}
			this.fieldvalues[i].push(value);
		}
	}
	createFields(typedef){
		if (typedef) for (let idx in typedef) {
			if (idx==0 && !typedef[idx]) continue; //primary key
			const [name,def]=typedef[idx].split('=');
			this.addColumn(name);
			const field= createField(name,def||{} , this.primarykeys , this.keys);
			this.fields.push(field);
		}
	}
	deserialize(section:string[]){
		const firstline=section.shift();
		const [text,tags]=parseOfftext(firstline);
		this.attrs=tags[0]?.attrs;
		this.name=this.attrs.name;
		this.caption=this.attrs.caption;
		const typedef=text.split('\t') ; // typdef of each field , except field 0
		this.createFields(typedef);
		this.keys=new StringArray(section.shift(),{sep:LEMMA_DELIMITER});  //local keys
		let idx=0 , usesection=false;
		for (let fieldname in this.fields) {
			const field=this.fields[fieldname];
			const linetext=section.shift();
			if (field.type==='number') {
				this.fieldvalues[idx]=unpackInt(linetext);
			} else if (field.type==='keys') {
				this.fieldvalues[idx]=unpackIntDelta2d(linetext);
			} else if (field.type==='key') {
				this.fieldvalues[idx]=unpackInt(linetext);
			} else if (field.type==='string') {
				this.fieldvalues[idx]=linetext.split(LEMMA_DELIMITER);
			} else if (field.type==='text') {
				section.unshift(linetext);
				usesection=true;
				this.fieldvalues[idx]=section;
			}
			idx++;
		}
		if (!usesection && section.length) {
			console.log('section not consumed');
		}
	}
	fromStringArray(sa:StringArray, from=1):string[]{
		const allfields=[];
		let line=sa.first();
		let textstart=0;// starting of indexable text

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
		this.createFields(this.typedef);

		if (!this.fieldnames.length)  return; // no type def
		for (let i=0;i<this.values.length;i++) {
			const fields=this.values[i];
			this.addRow(fields, i+1 ) ; //one base
		}
		const out=[this.keys.join(LEMMA_DELIMITER)]; //use StringTable
		for (let i=0;i<this.fieldnames.length;i++) {
			const V=this.fields[i];
			if (V.type=='number') {
				const numbers=this.fieldvalues[i].map(it=>parseInt(it)||0)||[];
				out.push(packInt( numbers));
			} else if (V.type=='keys') {
				const nums=(this.fieldvalues[i])||[];
				out.push(packIntDelta2d(nums));
			} else if (V.type=='key') {
				const nums=(this.fieldvalues[i])||[];
				out.push(packInt(nums));
			} else if (V.type=='string') {
				out.push(this.fieldvalues[i].join(LEMMA_DELIMITER));
			} else if (V.type=='text') {
				if (i!==this.fieldnames.length-1) {
					throw "text fieldtype must be the last, "+this.fieldnames[i];
				}
				textstart=out.length;
				out.push(...this.fieldvalues[i]);
			} else if (V.type){
				this.onError&&this.onError(VError.UnknownType,V.type);
			}
  		}
  		if (textstart==0) textstart=out.length;//no indexable text
		return [out,textstart];
	}
	fromTSV(buffer:string, from=1):string[]{
		const sa=new StringArray(buffer,{sequencial:true});
		return this.fromStringArray(sa,from);
	}
}
