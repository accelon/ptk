import {bsearch} from "../utils/bsearch.ts";
import {VError} from "./verrors.ts";
/* validate an attribute of tag or a tsv field*/
class Validator implements IValidator {
	constructor(name:string,def:Map){
		this.name=name;
		this.foreign=def.foreign||'';
		this.pattern=def.pattern||null;//regex pattern
		this.keys=def.keys||[];
		this.unique=null;
		this.values=[] ; //store if not foreign
		this.optional=true;
		this.caption='';
		this.type=def.type||'string';
		for (let n in def) {
				if (!this.hasOwnProperty(n)) {
					console.log('unknown defining attr',n,'of',name,def)
				}
				this[n]=def[n];
		}
		if (def.unique) this.unique={};
	}
  validate(value){
	  return [0,value];
  }
}
class NumberValidator extends Validator {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='number';
	}
	validate(value:string,line:number) {
		if (parseInt(value).toString()!==value && value.length) {
			return [VError.NotANumber , 0]; //default to 0
		}
		if (this.pattern && !value.match(this.pattern)) {
			return [VError.Pattern,0];
		}
		if (this.unique && value) {
			if (this.unique[value]) { //found in this line, cannot be zero
				return [VError.NotUnique, value, this.unique[value] ]; //send ref line
			} else {
				this.unique[value]=line; //first occurance
			}
		}
		return [0,parseInt(value)];
	}
}
class TextValidator extends Validator { //multiline 
	constructor(name:string,def:Map){
		super(name,def);
		this.type='text';
	}
}
class KeyValidator extends Validator {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='key';
	}
	validate(value:string,line:number){
		//convert items to key index, try foreign key first, 
		const keys=this.keys;
		if (!keys) return [VError.NoKeys,value];
		if (!value) { //empty value, validate pass if optional
			return [this.optional?0:VError.Mandatory,[]];
		}
		const at=bsearch(keys, value);
		if (keys[at]!==value){
			return [VError.NoKey,[]]
		} else {
			return [0,at];
		}
	}	
}
class KeysValidator extends Validator {
	constructor(name:string,def:Map){
		super(name,def);
		this.type='keys';
	}
	validate(value:string,line:number){
		//convert items to key index, try foreign key first, 
		const keys=this.keys;
		if (!keys) return [VError.NoKeys,value];
		if (!value) { //empty value, validate pass if optional
			return [this.optional?0:VError.Mandatory,[]];
		}
		const items=value.split(',').map(it=> {
			if (!it) return 0;
			const at=bsearch(keys, it);
			if (keys[at]===it) {
				return at;
			} else {
				return -1;
			}
		}).filter(it=>!!it).sort((a,b)=>a-b)
		if (items.filter(it=>it===-1).length) {
			return [VError.NoKey,[]]
		} else {
			return [0,items];
		}
	}	
}
export function createValidator(name,def:string,primarykeys,ownkeys) {

	if (typeof def!=='string') {
		return new Validator(name,def);
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

	if (typename=='number') v=new NumberValidator(name,{pattern});
	else if (typename=='unique_number') v=new NumberValidator(name,{pattern,unique:true,optional:false});
	else if (typename=='string') 	v=new Validator(name,{pattern});
	else if (typename=='text') 	v=new TextValidator(name,{pattern});
	else if (typename=='key') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeyValidator(name,{keys,pattern,foreign,optional:false});
	}	else if (typename=='keys') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeysValidator(name,{keys,pattern,foreign});
	}	else if (typename=='note') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new Validator(name,{type:typename,keys,pattern,foreign});
	}
	if (!v) v=new Validator(name,{}); //no validation is perform , just to suppress tag nodef warning
	return v;
}
/* for validate_z only, move to a zValidator*/
		// this.toc=[];
		// this.zcount=0;
		// this.prevzline=0;
		// this.prevdepth=0;

export function validate_z(tag){
  const depth=parseInt(tag.name.slice(1,2),36)-10;
  if (!(depth==this.prevdepth|| depth==this.prevdepth+1 || depth<this.prevdepth)) {
  	const msg='目彔深度错误 '+this.prevdepth+'+1!='+depth;
	  this.errors.push({msg,offset:tag.offset,prev:this.prevzline});
  }
  const text=this.linetext.slice(tag.choff,tag.choff+tag.width);
  const line=this.line;
  this.toc.push({depth,text,key:this.zcount, line});
  this.zcount++;
  this.prevzline=line;
  this.prevdepth=depth;
}