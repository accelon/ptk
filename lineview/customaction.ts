import {Action} from "./baseaction.ts";
import {parseAddress,IAddress,usePtk} from '../basket/index.ts';
import {runInfo} from './infoaction.ts';

export class CustomAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.painter=addr.action.slice(1);
		this.ptkname=addr.ptkname;
		this.diggable=true;
	}
	async run(){
		let items;
		const ptk=await usePtk(this.ptkname);
		if (this.painter=='info') {
			items=runInfo(ptk);
		} else if (this.painter=='systeminfo') {
			items=[];
		}
		this.ownerdraw={painter:this.painter, data:{ ptk,items,name:this.address, ptkname:this.ptkname}} ;          
		this.last=1;
	}
}