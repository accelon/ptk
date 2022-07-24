import { ILineBaser} from '../linebase/index.ts'
import  {parseJsonp} from '../utils/index.ts'
import {Pitaka} from './pitaka.ts'

export const inMemory=(lbaser:ILineBaser)=> {
	const ptk = new Pitaka({inmemory:true});
	lbaser.dump((fn,buf,page)=>ptk.setPage(page ,... parseJsonp(buf)));
	return ptk;
}