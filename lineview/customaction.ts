import {Action} from "./baseaction.ts";
import {parseAddress,IAddress,usePtk} from '../basket/index.ts';
export class CustomAction extends Action {
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.address =addr.action.slice(1);
		const at=this.address.indexOf('$');
		this.painter=~at?this.address.slice(at+1):'unknown';
		this.ptkname=this.address.slice(0,at);
		this.diggable=true;
	}
	async run(){
		this.ownerdraw={painter:this.painter, data:{ name:this.address, ptkname:this.ptkname}} ;          
		this.last=1;
	}
}