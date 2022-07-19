import {IOfftag} from '../offtext/index.ts';
import {ITypedef} from './interfaces.ts';
import {createValidator} from './validator.ts';
import {VError} from './verrors.ts';

export class Typedef implements ITypedef {
	constructor (attrs:Map, tagname:string, primarykeys:Map) {
		this.validators={};
		this.mandatory={};
		this.tagname=tagname;
		for (let aname in attrs) {
			const def=attrs[aname];
			const opts=typeof def=='string'?def:{optional:false};
			const V=createValidator(tagname,opts,primarykeys);
			if (V) this.validators[aname]=V;
			if (V && !V.optional) this.mandatory[aname]=true;
		}
	}
	validateAttrs(tag:IOfftag , line:number, onError) {
		let touched=false, newtag;
		if (line==3) debugger
		for (let aname in tag.attrs) {
			const V=this.validators[aname];
			let value=tag.attrs[aname];
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
}