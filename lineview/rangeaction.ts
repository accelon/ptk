import {Action} from "./baseaction.ts";
import {parseAddress,IAddress,usePtk} from '../basket/index.ts';
export class RangeAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.eleid=this.action;
		this.address =addr;
		this.diggable=true;
	}
	async run(){
		const ptk=usePtk(this.ptkname);
		[this.first, this.last]=ptk.rangeOfAddress(this.address);
	}
}