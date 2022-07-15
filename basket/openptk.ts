import {poolAdd,poolGet}  from './pool.ts';
import {LineBase} from '../linebase/index.ts';

export const openPtk=async (name:string)=>{
	if (!name) return null;
	const lbase = new LineBase({name});
	if (await lbase.isReady()) {
		poolAdd(lbase.name,lbase);
		return lbase;
	}
}

export const usePtk=(name:string)=>{
	return poolGet(name);
}
