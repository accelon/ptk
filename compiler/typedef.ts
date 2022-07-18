import {IOfftag} from '../offtext/index.ts';
import {ITypedef} from './interfaces.ts';
import {createValidator} from './validator.ts';

export class Typedef implements ITypedef{
	constructor (attrs:Map, tagname:string) {
		this.idobj=null;
		this.validators={};
		for (let n in attrs) {
			const def=attrs[n];
			if (typeof def=='string') {
				this.validators[n]=createValidator(tagname,def);
			} else {
				this.validators[n]=createValidator(tagname,{optional:false});
			}
		}
	}
	validate(fieldname,cell, type,pattern,line) {
		//validate each attribute
	}
}