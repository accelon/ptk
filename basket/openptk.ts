import {poolAdd,poolGet}  from './pool.ts';
import {Pitaka} from './pitaka.ts';
import {ZipStore} from '../zip/index.ts';

export const openPtk=async (name:string)=>{
	let ptk=usePtk(name);
	if (ptk) return ptk;
	if (!name) return null;
	ptk = new Pitaka({name});
	poolAdd(name,ptk); //add to pool for jsonp to work.
	if (await ptk.isReady()) {
		await ptk.init();
		return ptk;
	} else {
		poolDel(name);
	}
}
export const openInMemoryPtk=async(name:string, ptkimage:UInt8Array)=>{
	const zipstore=new ZipStore(ptkimage);
	const ptk=new Pitaka({name,zipstore});
	if (await ptk.isReady()) {
		await ptk.init();
		poolAdd(name,ptk);
		return ptk;
	}
}

export const usePtk=(name:string)=>{
	return poolGet(name);
}

export const getParallels=(address:string)=>{
	//scan all ptk and list parallels, first item is master
	console.log('pp')
	return 'pp'
}