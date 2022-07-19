import {bsearch} from "../utils/bsearch.ts";
import {VError} from "./verrors.ts";
export function pushError(msg,offset=0,prev=0){
	this.errors.push({filename:this.buffername,line:this.line,offset,msg,prev});
}
class Validator implements IValidator {
	constructor(name:string,def:Map){
		this.foreign='';
		this.def='';
		this.name=name;
		this.unique=null;
		this.pattern=null;//regex pattern
		this.optional=true;
		for (let n in def) this[n]=def[n];
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
				return at+1;
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
	else if (typename=='keys') {
		const keys=(primarykeys&&primarykeys[foreign]) ||ownkeys;
		v=new KeysValidator(name,{keys,pattern});
	}
	if (!v) v=new Validator(name,def);
	return v;
}
export function validate_id(tag,typedef){
	const type=typedef.type;
	const id=tag.attrs.id;
	const name='^'+tag.name;
	if (!id) {
		pushError.call(this,name+' 缺少 id',tag.offset);
		return;
	}

	if (typedef.id=='number' || typedef.id=='unique_number') {
		if (isNaN(parseInt(id))) 	pushError.call(this,tag.name+' id 非数字 '+id, tag.offset);
		else if (typedef.id=='unique_number') {
			const prev=typedef.idobj[id];
			if (prev) pushError.call(this,name+' id 重复 '+id, tag.offset, prev);
			typedef.idobj[tag.attrs.id]=this.line;
		}
	}
}

export function validate_z(tag){
  const depth=parseInt(tag.name.slice(1,2),36)-10;
  if (!(depth==this.prevdepth|| depth==this.prevdepth+1 || depth<this.prevdepth)) {
    pushError.call(this,'目彔深度错误 '+this.prevdepth+'+1!='+depth, tag.offset, this.prevzline);
  }
  const text=this.linetext.slice(tag.x,tag.x+tag.w);
  const line=this.line;
  this.toc.push({depth,text,key:this.zcount, line});
  this.zcount++;
  this.prevzline=line;
  this.prevdepth=depth;
}
export const validators={id:validate_id};