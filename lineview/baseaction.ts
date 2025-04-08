import { parallelWithDiff } from '../align/parallels.ts';
import {IAddress,usePtk} from '../basket/index.ts';
import {parseCriteria} from '../fts/criteria.ts';
import {IAction,ACTIONPAGESIZE} from './interfaces.ts';

export const EXCERPTACTIONPREFIX='*';
export const GUIDEACTIONPREFIX='!';
export const TITLECOUNTACTIONPREFIX='~';
export const OWNERDRAWPREFIX='@';
export const COLUMNFIELDSEP = ".";
export class Action implements IAction{
	constructor (addr:IAddress,depth=0, dividx=0) {
		this.act=Action.parse(addr.action);
		this.action=addr.action;
		this.depth=depth;

		this.first=0; //first line of the chunk
		this.last=0;  //last line of the chunk

		this.highlightline=addr.highlightline||-1; //line with search keyword
		this.from=addr.from;
		this.till=addr.till||-1; //-1 to the end
		this.res=[];
		this.text='';
		this.lines=[];//for search result, non continous line
		this.diggable=false;
		this.closable=true;
		this.ptkname=addr.ptkname;
		this.opts={} ;//display options
		this.dividx=dividx;
		this.pagable=true;
	}
	async run(){

	}
	lineOf(idx:number){
		return this.first+idx;
	}
	getLines(){
		const out=[];
		let till=this.till;
		if (till==-1) till=this.from+ACTIONPAGESIZE; //show partial content if not mention till
		for (let i=this.from;i<till;i++) {
			const line=this.lineOf(i);
			if (line<this.first || line>=this.last) continue;
			out.push(line);
		}
		return out;
	}
	getParallelWithDiff(){
		const ptk=usePtk(this.ptkname);
		return parallelWithDiff(ptk,this.first+this.from);
	}

	static parse(action:string){
		return parseCriteria(action);
	}
}