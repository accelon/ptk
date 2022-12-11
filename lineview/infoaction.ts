import {Action} from "./baseaction.ts";
import {IAddress,usePtk} from '../basket/index.ts';

export class InfoAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.address =addr;
	}

	async run(){
        const ptk=usePtk(this.ptkname);
        const caption=ptk.captionOfAddress(this.address);
        let {name}=this.act[0];
		this.ownerdraw={painter:'info', data:{from:this.from, name, caption,ptk}} ;
    }
}