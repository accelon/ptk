export const cssSkeleton=(typedefs:Map<string,any>,ptkname:string)=>{
	const out=[];
	for (let n in typedefs) {
		out.push('.'+ptkname+' .'+n+' \n{ \n}');
	}
	return out.join('\n')
}