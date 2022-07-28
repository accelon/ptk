export interface ICriterion {
	name:string,
	tofind:string,
	res:[]
}
export const runCriterion=(ptk:IPitaka,name,c:ICriterion)=>{
	const typedef=ptk.columns[name]
	console.log('run',name)
	
}
export const parseQuery=(cstr:string)=>{
	const query={};
	const criteria=cstr.split(';');
	for (let i=0;i<criteria.length;i++) {
		const [name,tofind]=criteria[i].split('=');
		console.log(name,tofind)
		query[name]={tofind, res:null};
	}
	return query;
}