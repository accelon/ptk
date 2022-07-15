import {parseLisp} from './lisp.ts';
export const parseLVA = (address:string)=>{
	if (address[0]!=='(') address='('+address+')';
	const expr=parseLisp(address);
	return expr;
}

export const stringifyLVA= (lva:[], url=false)=>{
	let out=[], prev=false;

	lva.forEach((item,idx)=>{
		if (Array.isArray(item)) {
			out.push('('+stringifyLVA(item,url)+')');
			prev=true;
		} else {
			const v= (idx && !prev?(url?'+':' '):'')+item.value;
			out.push(v)
			prev=false;
		}
	});
	return out.join('');
}