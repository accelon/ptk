import {IAddress,usePtk} from '../basket/index.ts';
import {poolParallelPitakas} from '../basket/pool.ts';
import {parseCriteria} from '../fts/criteria.ts';
import {IAction} from './interfaces.ts';
export const ACTIONPAGESIZE=5;
export const EXCERPTACTIONPREFIX='*';
export const GUIDEACTIONPREFIX='!';
export const TITLECOUNTACTIONPREFIX='~';
export const OWNERDRAWPREFIX='@';

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
		const out=[];
		const ptk=usePtk(this.ptkname);
		if (!ptk) return out;
		const parallelPitakas=poolParallelPitakas(ptk);
		for (let i=0;i<parallelPitakas.length;i++) {
			const pptk=usePtk(parallelPitakas[i]);
			const thisline=this.lineOf(this.from);
			const lines=pptk.getParallelLine( ptk, thisline );			
			lines.forEach( it=>out.push([pptk,it]))
		}

		//因為nearesttag 返回 0 表示 出現在第一個bk 之前
		const line=this.lineOf(this.from);
		const bk=ptk.nearestTag(line,'bk')-1;
		const bookstart=ptk.defines.bk.linepos[bk];
		const lineoff=line-bookstart;
		const books=ptk.getParallelBook(bk);
		for (let i=0;i<books.length;i++) {
			const [start,end]=ptk.rangeOfAddress('bk#'+books[i]);
			if (lineoff <= end-start) {
				//假設每一行都對齊，所以返回 書的行差
				out.push([ptk, start-bookstart ]);
			}
		}	
		return out;
	}

	static parse(action:string){
		return parseCriteria(action);
	}
}