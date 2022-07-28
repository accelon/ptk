import {IOfftag} from '../offtext/index.ts';
import {ITypedef} from './interfaces.ts';
import {createValidator} from './validator.ts';
import {VError} from './verrors.ts';
import {packInt,packIntDelta,unpackIntDelta,unpackInt,LEMMA_DELIMETER} from '../utils/index.ts'
/* types of attributes defined by ^:  */
export class Typedef implements ITypedef {
	constructor (attrs:Map, tagname:string, primarykeys:Map) {
		this.validators={}; /* attribute might have validator */
		this.mandatory={};  
		this.tagname=tagname;
		this.linepos=[];
		this.savelinepos=false;   
		for (let aname in attrs) {
			const def=attrs[aname];
			const opts=typeof def=='string'?def:{optional:false};
			const V=createValidator(tagname,opts,primarykeys);
			if (V) this.validators[aname]=V;
			if (V && !V.optional) this.mandatory[aname]=true;
		}
		this.attrs=attrs;
	}
	validateTag(tag:IOfftag , line:number, compiledLine:number , onError) {
		let touched=false, newtag;
		if (this.validators.id || this.savelinepos) { //auto save linepos if validating id
			this.linepos.push(compiledLine+line);
		}
		for (let aname in tag.attrs) {
			const V=this.validators[aname];
			let value=tag.attrs[aname];
			if (V&&!V.foreign) V.values.push(tag.attrs[aname]);
			let [err,newvalue,refline]= (V&&V.validate( tag.attrs[aname], line)) ||[0,value,-1];
			if (err) {
				onError(err, newvalue , refline);
			} else if (newvalue!=value) { //type cast here  
				if (!touched) {
					newtag=Object.assign({},tag);
					newtag.attrs=Object.assign({},tag.attrs);
				}
				if (Array.isArray(newvalue)) newvalue=newvalue.join(',');
				newtag.attrs[aname]=newvalue;
				touched=true;
			}
		}
		for (let aname in this.mandatory) {
			if (!tag.attrs.hasOwnProperty(aname) && this.mandatory[aname]) {
				onError(VError.Mandatory, aname);
			}
		}
		return newtag;
	}
	deserialize(section){
		const attrs=section.shift().split(LEMMA_DELIMETER);
		if (section.length > attrs.length) {
			this.linepos=unpackIntDelta(section.shift());
		}
		for (let i=0;i<attrs.length;i++) {
			const aname=attrs[i];
			const V=this.validators[aname];
			if (V.type=='number'){
				V.values=unpackInt(section.shift());	
			}
		}
		if (section.length) {
			console.log("unconsumed section lines",section.length);
		}
	}
	serialize(){
		const attrs=[],out=[];
		for (let aname in this.validators) {
			const V=this.validators[aname];
			if (!V.foreign) {
				if (V.type=='number') {
					attrs.push(aname);
					out.push(packInt(V.values.map(it=>parseInt(it))));
				}
			}
		}
		
		if (this.linepos.length) {
			out.unshift(packIntDelta(this.linepos));
		}
		if (attrs.length) {
			out.unshift(attrs.join(LEMMA_DELIMETER));
		}

		return out.length?out.join('\n'):null;
	}
}