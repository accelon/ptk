export interface ICriterion {
	name:string,
	tofind:string,
	res:[]
}
export const runCriterion=(ptk,name,c:ICriterion)=>{
	const typedef=ptk.columns[name]
	console.log('run',name)
	
}
export const parseCriteria=(cstr:string)=>{
	const query=[];
	const criteria=cstr.split(';');
	for (let i=0;i<criteria.length;i++) {
		const [name,tofind]=criteria[i].split('=');
		query.push({name,tofind});
	}
	return query;
}