import {Action,GUIDEACTIONPREFIX} from "./baseaction.ts";
import {IAddress,usePtk} from '../basket/index.ts';

export class GuideAction extends Action{
	constructor(addr:IAddress,depth=0){
		super(addr,depth);
		this.address =addr;
	}

	async run(){
        const ptk=usePtk(this.ptkname);
        const caption=ptk.captionOfAddress(this.address);
        let {name}=this.act[0];
		const action=this.address.action.slice(1);
		const idx=this.dividx;
		const actionprefix=GUIDEACTIONPREFIX;
		this.ownerdraw={painter:'guide', data:{from:this.from, actionprefix,idx, name, action,caption,ptk}} ;
    }
}