import {IAddress,usePtk} from '../basket/index.ts';
import {poolParallelPitakas} from '../basket/pool.ts';
import {parseCriteria} from '../fts/criteria.ts';
import {IAction} from './interfaces.ts';
export const ACTIONPAGESIZE=5;
export class Action implements IAction{
	constructor (addr:IAddress,depth=0) {
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
		this.ptkname=addr.ptkname;
		this.opts={} ;//display options
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
			const line=this.lineOf(this.from);
			const [hasparallel, linediff]=pptk.getParallelLine( ptk, line );
			if (hasparallel) out.push([pptk, linediff]);
		}
		return out;
	}
	async loadParallel(ptkname:string) { //load a specific ptkname
		let parallels=this.getParallelWithDiff().filter( ([p])=>p.name==ptkname);
		if (!parallels.length)return;
		const ptk=usePtk(this.ptkname);
		const pptk=parallels[0][0];
		const [hasparallel, linediff]=pptk.getParallelLine( ptk, this.first );
		if (hasparallel) await pptk.loadLines( [ [this.first+this.from+linediff, this.first+this.till+linediff] ],true);
	}
	static parse(action:string){
		return parseCriteria(action);
	}
}