import {IOfftag} from '../offtext/index.ts';
import {ITypedef} from './interfaces.ts';
import {createField} from './fielder.ts';
import {VError} from './error.ts';
import {StringArray} from '../utils/stringarray.ts'

import {unique,packInt,packIntDelta,unpackIntDelta,unpackInt,LEMMA_DELIMITER,removeBracket} from '../utils/index.ts'

/* types of attributes defined by ^:  */
const reservedAttributes={ //是指令不是屬性名, 
	caption:true,
	lazy:false,
	key:true,
	field:true,
	text:true,
	type:true //name of painter
}
export class Typedef implements ITypedef {
	constructor (attrs:Map, tagname:string, primarykeys:Map, typedefs:Map) {
		this.fields={}; /* attribute might have validator */
		this.mandatory={};  
		this.tagname=tagname;
		this.linepos=[];
		this.innertext=[];
		this.typedefs=typedefs;//to other typedefs
		
		for (let aname in attrs) {
			const def=attrs[aname];
			const opts=typeof def=='string'?def:{optional:false};
			const V=createField(tagname,opts,primarykeys);
			if (V) this.fields[aname]=V;
			if (V && !V.optional && !reservedAttributes[aname]) this.mandatory[aname]=true;
		}

		this.attrs=attrs;
		this.column='';  //backing column of this tag , see basket/pitaka.ts::init()
		this.count=0;

		if (this.attrs.resetby) {
			const resettingparents=this.attrs.resetby.split(',');
			for (let i=0;i<resettingparents.length;i++) {
				const parent=this.typedefs[resettingparents[i]];
				if (parent) {
					if (!parent.attrs.reset) {
						parent.attrs.reset=tagname;
					} else {
						const arr=parent.attrs.reset.split(',');
						arr.push( tagname);
						parent.attrs.reset= unique(arr).join(',');
					}
				} else {
					console.log("not such parent tag",resettingparents[i])
				}
			}
			
		}
	}
	resetChildTag(){
		if (this.attrs.reset) {
			const resetting=this.attrs.reset.split(',');
			for (let i=0;i<resetting.length;i++) {
				const childtypedef=this.typedefs[resetting[i]];
				if (childtypedef) {
					for (let fieldname in childtypedef.fields) {
						const field=childtypedef.fields[fieldname];
						if (field.unique) {
							// console.log('reset',childtypedef.tagname,fieldname)
							field.resetUnique();
						}
					}
				}
			}
		} 
	}	
	validateFields(tag,line,onError,compiledFiles){
		let touched=false,newtag;
		this.count++;
		// for (let aname in tag.attrs) {
		for (let aname in this.attrs){
			const V=this.fields[aname];
			let value=tag.attrs[aname];
			if (V&&!V.foreign) V.values.push(tag.attrs[aname]);

			let [err,newvalue,refline]= (V&&V.validate( tag.attrs[aname], line,compiledFiles)) ||[0,value,-1];

			if (err) {
				onError(err, newvalue , refline);
			} else { // if (newvalue!=value) { //type cast here  
				
				if (!touched) {
					newtag=Object.assign({},tag);
					newtag.attrs=Object.assign({},tag.attrs);
				}

				if (Array.isArray(newvalue)) newvalue=newvalue.join(',');
				newtag.attrs[aname]=newvalue;
				touched=true;
			}
		}
		return newtag
	}
	validateTag(offtext:IOfftext, tag:IOfftag , line:number, compiledLine:number , compiledFiles, onError) {
		if (this.fields.id || this.fields['@'] || this.attrs.savelinepos) { //auto save linepos if validating id
			this.linepos.push(compiledLine+line);
		}
		if (this.attrs.bracket) { // false to keep the bracket
			let tagtext=offtext.tagText(tag);
			if (!tagtext) { //use entire line as innertext
				tagtext=offtext.plain.trim().slice(0,10);
			}
			if (this.attrs.bracket!=='true') tagtext=removeBracket(tagtext);
			this.innertext.push(tagtext);
		}
		for (let aname in this.mandatory) {
			if (!tag.attrs.hasOwnProperty(aname) && this.mandatory[aname]) {
				onError(VError.Mandatory, tag.name+' '+aname);
			}
		}
		this.resetChildTag();
		const newtag=this.validateFields(tag,line,onError,compiledFiles);
		return newtag;
	}
	deserialize(section,ptk){
		const attrline=section.shift();
		const attrs=attrline?attrline.split(LEMMA_DELIMITER):[];
		if (section.length > attrs.length) {
			this.linepos=unpackIntDelta(section.shift());
		}
		this.innertext=null;
		if (!section.length) return;
		if (this.fields.bracket) {
			this.innertext=new StringArray(section.shift(),{sep:LEMMA_DELIMITER});
		}
		for (let i=0;i<attrs.length;i++) {
			const aname=attrs[i];
			const V=this.fields[aname];
			if (!V) {
				console.error("unknown type "+aname);
				continue;
			}
			if (V?.type==='number'){
				V.values=unpackInt(section.shift());
			} else if (V?.type==='text') {
				V.values=section.length?section.shift().split('\t'):[];
			} else if (V?.deserialize) {
				V.values=V.deserialize(section,ptk);
			}
		}
		if (section.length) {
			console.log("unconsumed section lines",section.length);
		}
	}
	serialize(){
		const attrs=[],out=[];
		if (!this.count) return null;
		if (this.linepos.length || this.fields.bracket) { 
			//if innertext exists , must pack linepos even if empty
			out.push(packIntDelta(this.linepos));
		}
		if (this.fields.bracket) {
			out.push(this.innertext.join(LEMMA_DELIMITER));
		}
		for (let aname in this.fields) {
			const V=this.fields[aname];
			if (V.foreign) continue;
			if (V.type=='number') {
				attrs.push(aname);
				out.push(packInt(V.values.map(it=>parseInt(it)||0)));
			} else if (V.type=='text') {
				attrs.push(aname);
				out.push( V.values.join('\t'));
			} else if (V.serialize) {
				attrs.push(aname);
				const arr=V.serialize();
				for (let i=0;i<arr.length;i++) {
					out.push(arr[i]);
				}
			}
		}
		out.unshift(attrs.join(LEMMA_DELIMITER));
		return out.length?out.join('\n'):null;
	}
}