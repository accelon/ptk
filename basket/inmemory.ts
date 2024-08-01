import {ILineBaser} from '../linebase/index.ts'
import {parseJsonp} from '../utils/index.ts'
import {Pitaka} from './pitaka.ts'
import {poolAdd}  from './pool.ts';

export const inMemory=(lbaser:ILineBaser)=> {
	if (!lbaser.name) lbaser.setName('inmemory');
	const ptk = new Pitaka({inmemory:true});
	lbaser.dumpJs((fn,buf,page)=>ptk.setPage(page ,... parseJsonp(buf)));
	poolAdd(lbaser.name,ptk);
	return ptk;
}