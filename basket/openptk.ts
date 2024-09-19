import {poolAdd,poolGet,poolDel,poolGetAll}  from './pool.ts';
import {Pitaka} from './pitaka.ts';
import {ZipStore} from '../zip/index.ts';
export const openPtk=async (name,cachedimage:any=null)=>{
	let ptk=usePtk(name);
	if (ptk) return ptk;
	if (!name) return null;
	const opts={name};
	if (cachedimage) {
		opts["zipstore"]=new ZipStore(cachedimage);
	}
	ptk = new Pitaka(opts);
	poolAdd(name,ptk); //add to pool for jsonp to work.
	if (await ptk.isReady()) {
		await ptk.init();	
		/*
		const poolptk=poolGetAll();
		for (let i=0;i<poolptk.length;i++) {
			poolptk[i].addForeignLinks(ptk);
		}
		*/
		return ptk;
	} else {
		poolDel(name);
	}

}
export const openInMemoryPtk=async(name:string, ptkimage:Uint8Array)=>{
	const zipstore=new ZipStore(ptkimage);
	const ptk=new Pitaka({name,zipstore});
	if (ptk.isReady()) {
		await ptk.init();
		poolAdd(name,ptk);
		return ptk;
	}
}
export const ptkFromString=(name:string,contentString:string)=>{
	const ptk=new Pitaka({name,contentString});
	ptk.init();
	poolAdd(name,ptk)
	return ptk;
}
export const usePtk=(name:string)=>{
	if (!name) return null;
	return poolGet(name);
}

