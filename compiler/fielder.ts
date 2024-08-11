import {VError} from "./error.ts";
/* validate an attribute of tag or a tsv field*/
import {Field} from './basefield.ts';
import {LinkField} from './linkfield.ts';
import {KeyField} from './keyfield.ts';
import {KeysField} from './keysfield.ts';
import {TextField} from './textfield.ts';
import {NumberField} from './numberfield.ts';
import {NumbersField} from './numbersfield.ts';
import {FileLinePosField} from './filelineposfield.ts';
import {GroupField} from './groupfield.ts';
import {IOfftext,IOfftag} from './offtext/index.ts';
import {closeBracketOf} from '../utils/index.ts';
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
	if (typename==='number') v=new NumberField (name,{pattern,foreign});
	else if (typename==='numbers') v=new NumbersField (name,{pattern,foreign});
	else if (typename==='filelinepos') v=new FileLinePosField (name,{pattern,foreign});
	else if (typename==='unique_number') v=new NumberField (name,{pattern,unique:true,optional:false,foreign});
	else if (typename==='unique') v=new TextField(name,{pattern,unique:true,optional:false,foreign});
	else if (typename==='string') 	v=new Field (name,{pattern,foreign});
	else if (typename==='link') 	v=new LinkField (name,{pattern,foreign});
	else if (typename==='text') 	v=new TextField (name,{pattern});
	else if (typename==='key') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeyField (name,{keys,pattern,foreign,optional:false});
	}	else if (typename==='keys') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeysField (name,{keys,pattern,foreign});
	} else if (typename==='group') {
		v=new GroupField (name,{type:typename});
	}	else if (typename==='note') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new Field (name,{type:typename,keys,pattern,foreign});
	} else if (typename==='confer') {
		v=new Field (name,{type:typename,foreign});
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
  if (isNaN(depth)) return; //invalid z
  if (!(depth==this.prevdepth|| depth==this.prevdepth+1 || depth<this.prevdepth)) {
  	const msg='目彔深度错误 '+this.prevdepth+'+1!='+depth;
	  this.errors.push({msg,offset:tag.offset,prev:this.prevzline});
  }

  let  text=offtext.tagText(tag);
  const closebracket=closeBracketOf(text);
  if (text.slice(text.length-1)==closebracket) text=text.slice(1,text.length-1);

  const line=this.compiledLine+this.line;
  this.toc.push({depth,text,key:this.zcount, line});
  this.zcount++;
  this.prevzline=line;
  this.prevdepth=depth;
}

//多層id 
export function validate_y(offtext:IOfftext,tag:IOfftag){
}
//內文跳轉
export function validate_x(offtext:IOfftext,tag:IOfftag){
}