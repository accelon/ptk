import {poolAdd,poolGet}  from './pool.ts';
import {Pitaka} from './pitaka.ts';

export const openPtk=async (name:string)=>{
	let ptk=usePtk(name);
	if (ptk) return ptk;
	if (!name) return null;
	ptk = new Pitaka({name});
	if (await ptk.isReady()) {
		await ptk.init();
		poolAdd(name,ptk);
		return ptk;
	}
}

export const usePtk=(name:string)=>{
	return poolGet(name);
}
