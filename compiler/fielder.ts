import {VError} from "./error.ts";
/* validate an attribute of tag or a tsv field*/
import {Field} from './basefield.ts';
import {KeyField} from './keyfield.ts';
import {KeysField} from './keysfield.ts';
import {TextField} from './textfield.ts';
import {NumberField} from './numberfield.ts';
import {IOfftext,IOfftag} from './offtext/index.ts'
export function createField(name,def:string,primarykeys,ownkeys) {
	if (typeof def!=='string') {
		return new Field (name,def);
	}
	let v;
	const m=def.match(/([a-z_]+):?([a-z_]*)\/?(.*)/);
	if (!m) {
		return;
	}
	const typename=m[1], foreign=m[2];
	let pat=m[3], pattern;
	if (pat) {
		const at2=pat.lastIndexOf('/');
		let regopts='';
		if (at2>0) {
			regopts=pat.slice(at2+1);
			pat=pat.slice(0,at2)
		}
		pattern= new RegExp(pat,regopts);
	}

	if (typename=='number') v=new NumberField (name,{pattern});
	else if (typename=='unique_number') v=new NumberField (name,{pattern,unique:true,optional:false});
	else if (typename=='string') 	v=new Field (name,{pattern});
	else if (typename=='text') 	v=new TextField (name,{pattern});
	else if (typename=='key') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeyField (name,{keys,pattern,foreign,optional:false});
	}	else if (typename=='keys') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeysField (name,{keys,pattern,foreign});
	}	else if (typename=='note') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new Field (name,{type:typename,keys,pattern,foreign});
	}
	if (!v) v=new Field (name,{}); //no validation is perform , just to suppress tag nodef warning
	return v;
}
/* for validate_z only, move to a zField */
		// this.toc=[];
		// this.zcount=0;
		// this.prevzline=0;
		// this.prevdepth=0;

export function validate_z(offtext:IOfftext,tag:IOfftag){
  const depth=parseInt(tag.name.slice(1,2),36)-10;
  if (!(depth==this.prevdepth|| depth==this.prevdepth+1 || depth<this.prevdepth)) {
  	const msg='目彔深度错误 '+this.prevdepth+'+1!='+depth;
	  this.errors.push({msg,offset:tag.offset,prev:this.prevzline});
  }
  const text=offtext.tagText(tag);//.choff,tag.choff+tag.width);
  const line=this.line;

  this.toc.push({depth,text,key:this.zcount, line});
  this.zcount++;
  this.prevzline=line;
  this.prevdepth=depth;
}