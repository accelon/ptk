/* store in column oriented */ 
import {LEMMA_DELIMITER,StringArray,alphabetically0,alphabetically,
	packIntDelta2d,	unpackIntDelta2d,packInt,unpackInt} from "../utils/index.ts"
import {createField} from  "../compiler/fielder.ts"
import {VError} from  "../compiler/error.ts"
import {tokenize,TokenType} from "../fts/tokenize.ts"
import {parseOfftext} from '../offtext/index.ts'
export class Column {
	fieldvalues:Array<Array<any>>
	fieldnames:Array<string>
	fieldsdef:Array<any>
	name:string
	attrs:Record<string,any>
	caption:string
	keys:StringArray|null
	primarykeys:Record<string,any>
	onError:Function
	tokenfield:number
	tokentable:Record<string,any>
	runtimetokentable:Array<string>
	typedef:Record<string,any>|null
	constructor(opts={}) {
		this.fieldvalues=[];
		this.fieldnames=[];
		this.fieldsdef=[];
		this.name='';
		this.keys=null;  //keys, null if keytype==serial 
		this.primarykeys=opts.primarykeys||{};
		this.onError=opts.onError;
		this.typedef=opts.typedef;
		this.tokenfield=-1; // 0 tokenize the key field, 1 first field 
		this.tokentable={}; //快速知道有沒有這個token，免去除, runtime 是 Object
		this.runtimetokentable=Array<string>();
	}
	//lexicon :: key(sorted primary key) = payload
	addColumn(name:string){
		this.fieldnames.push(name)
		this.fieldvalues.push([]);
	}
	tokenizeField(value:string){
		const tokenized=tokenize(value);
		for (let i=0;i<tokenized.length;i++) {
			const {text,type}=tokenized[i];
			if (type>TokenType.SEARCHABLE && !this.tokentable[text]) {				
				this.tokentable[text]=true;
			}
		}
	}
	addRow(fields:string[], nrow:number , skipFirstField,compiledFiles){
		let i=0;
		if (skipFirstField) i++;
		for (;i<this.fieldsdef.length;i++) { //fields.length might be less than this.fieldsdef
			const F=this.fieldsdef[i];
			const [err,value]=F.validate(fields[i], nrow, compiledFiles);
			if (err) {
				this.onError&&this.onError(err,this.fieldnames[i]+' '+fields[i],-1, nrow);
			}
			this.fieldvalues[i].push(value||'');
			if (i+1==this.tokenfield) this.tokenizeField(value);
		}
	}
	createFields(typedef){
		if (typedef) for (let idx in typedef) {
			const fieldtype=typedef[idx]||'key=string';
			const [name,def]=fieldtype.split('=');
			this.addColumn(name);
			const field= createField(name,def||{} , this.primarykeys , this.keys);
			this.fieldsdef.push(field);
		}
	}
	deserialize(section:string[]){
		if (!section.length) return;
		const firstline=section.shift();
		const [text,tags]=parseOfftext(firstline);
		if (!section.length) return;

		this.attrs=tags[0]?.attrs;
		this.name=this.attrs.name;
		this.caption=this.attrs.caption;
		
		const typedef=text.split('\t') ; // typdef of each field , except field 0
		this.createFields(typedef);
		if (this.attrs.keytype=='serial' ) {
			this.keys=null;
		} else {
			this.keys=new StringArray(section.shift(),{sep:LEMMA_DELIMITER});  //local keys
		}

		if (this.attrs.tokenfield) {
			this.tokenfield=parseInt(this.attrs.tokenfield);
			this.runtimetokentable=(section.shift()||'').split(LEMMA_DELIMITER);
			this.runtimetokentable.sort(alphabetically);
		}

		let idx=0 , usesection=false;
		for (let fieldname in this.fieldsdef) {
			const field=this.fieldsdef[fieldname];
			if (field.type==='number') {
				this.fieldvalues[idx]=unpackInt(section.shift());
			} else if (field.type==='numbers') {
				this.fieldvalues[idx]=unpackIntDelta2d(section.shift());
			} else if (field.type==='filelinepos') {
				this.fieldvalues[idx]=unpackIntDelta2d(section.shift());
			} else if (field.type==='keys') {
				this.fieldvalues[idx]=unpackIntDelta2d(section.shift());
			} else if (field.type==='key') {
				this.fieldvalues[idx]=unpackInt(section.shift());
			} else if (field.type==='string') {
				this.fieldvalues[idx]=section.shift().split(LEMMA_DELIMITER);
			} else if (field.type==='group') {
				field.deserialize(section); //deserialize the group index
				this.fieldvalues[idx]=unpackInt(section.shift()); //deserialize the value
			} else if (field.type==='text') {
				usesection=true;
				this.fieldvalues[idx]=section;
			}
			//short hand
			if (!this[field.name]) {
				this[field.name]=this.fieldvalues[idx];
			}
			
			idx++;
		}
		if (!usesection && section.length) {
			console.log('section not consumed');
		}
	}
	fromStringArray(sa:StringArray, attrs={},from=1,compiledFiles):[Array<string>,number]{
		const allfields=Array<Array<any>>();
		let line=sa.first();
		let textstart=0;// starting of indexable text
		let skipFirstField=false;
		
		while (from>0) {
			line=sa.next();
			from--;
		}
		while (line || line===''){
			const fields=line.split('\t');
			allfields.push(fields);
			line=sa.next();
		}
		if (attrs.keytype!=='serial') {
			allfields.sort(alphabetically0);
			skipFirstField=true;
			this.keys=allfields.map(it=>it[0]);
		}
		this.createFields(this.typedef);
		
		if (attrs.tokenfield) {
			this.tokenfield=parseInt(attrs.tokenfield||-1);
			//simply build token table without posting
			this.tokentable={};
			if (this.tokenfield===0) this.tokenizeField( this.keys.join(LEMMA_DELIMITER));
		}

		if (!this.fieldnames.length)  {
			throw "missing typedef"
		}
		for (let i=0;i<allfields.length;i++) {
			this.addRow(allfields[i], i+1 , skipFirstField,compiledFiles) ; //one base
		}
		const out=Array<string>(); 
		if (this.keys) out.push(this.keys.join(LEMMA_DELIMITER))
		if (this.tokenfield>-1) {
			out.push( Object.keys(this.tokentable).join(LEMMA_DELIMITER) )
		}
		for (let i=0;i<this.fieldnames.length;i++) {
			const V=this.fieldsdef[i];
			if (V.type=='number' || V.type=='line') {
				const numbers=this.fieldvalues[i].map(it=>parseInt(it)||0)||[];
				//convert line to text line at runtime
				out.push(packInt( numbers));
			} else if (V.type=='numbers' || V.type=='filelinepos') {
				const numbers=(this.fieldvalues[i])||[];
				if (numbers.length==1) {
					throw "must have more than one array"
				}
				// console.log(numbers)
				out.push(packIntDelta2d(numbers));
			} else if (V.type=='keys') {
				const numnums=(this.fieldvalues[i])||[];
				out.push(packIntDelta2d(numnums));
			} else if (V.type=='key') {
				const nums=(this.fieldvalues[i])||[];
				out.push(packInt(nums));
			} else if (V.type=='string') {
				out.push(this.fieldvalues[i].join(LEMMA_DELIMITER));
			} else if (V.type=='group') {
				V.serialize(out);
				out.push( packInt(this.fieldvalues[i]));
			} else if (V.type=='text') {
				if (i!==this.fieldnames.length-1) { //只有最後的欄位可以為多行text
					throw "multiline text fieldtype must be the last, "+this.fieldnames[i];
				}
				textstart=out.length;
				for (let j=0;j<this.fieldvalues[i].length;j++) {
					out.push(this.fieldvalues[i][j])
				}
			} else if (V.type){
				this.onError&&this.onError(VError.UnknownType,V.type);
			}
  		}
  		if (textstart==0) textstart=out.length;//no indexable text

		return [out,textstart];
	}
	fromTSV(buffer:string, attrs,from=1):[Array<string>,number]{
		const sa=new StringArray(buffer,{sequencial:true});
		return this.fromStringArray(sa,attrs,from,this.compiledFiles);
	}
	toTSV(){
		if (!this.keys) return;
		let key=this.keys.first();
		let at=0;
		const out=Array<string>();
		while (key) {
			const rows=[key];
			for (let i=1;i<this.fieldvalues.length;i++) {
				rows.push(this.fieldvalues[i][at]);
			}
			key=this.keys.next();
			at++;
			out.push(rows.join('\t'))
		}
		return out.join('\n');
	}
	findKey(key:string){
		if (this.keys) {
			return this.keys.find(key.toString());
		} else {
			return parseInt(key)-1;
		}
	}
	fieldsByKey(key:string){
		const at=this.findKey(key);
		if (!key) return null;
		if(~at) {
			const out={key};
			for (let i=0;i<this.fieldvalues.length;i++) {
				out[this.fieldnames[i]]=this.fieldvalues[i][at];
			}
			return out;
		} else return null;
	}
	fieldByKey(key:string,fieldname:'') {
		const at=this.findKey(key);
		if (!key) return null;
		if(~at) {
			const out={key};
			const at2=this.fieldnames.indexOf(fieldname);
			if (~at2) {
				return this.fieldvalues[at2][at];
			} else { //return second field
				return this.fieldvalues[1][at];
			}
		} else return null;
	}
	getKey(i:number) {
		if (this.keys) {
			return this.keys.get(i)
		} else {
			return (i+1).toString()
		}
	}
}
