import {bsearch,unique,alphabetically} from '../utils/index.ts';
export type Lexicon = string[];

export const lexiconUnion=(lexicons:Lexicon[])=>{
	if (!lexicons || lexicons.length<2) return lexicons;
	let out=unique(lexicons[0]);
	for (let i=1;i<lexicons.length;i++) {
		const arr=unique(lexicons[i]);
		const res=[];
		for (let j=0;j<arr.length;j++) {
        	const at=bsearch(out, arr[j]);
        	if (out[at]!==arr[j]) res.push(arr[j]);
        }
        out.push(...res);
        out.sort(alphabetically);
    }
	return out;
}

export const lexiconIntersect=(lexicons:Lexicon[])=>{
	if (!lexicons || lexicons.length<2) return lexicons;
	let out=unique(lexicons[0]);
	for (let i=1;i<lexicons.length;i++) {
		const arr=unique(lexicons[i]);
		const res=[];
		for (let j=0;j<arr.length;j++) {
        	const at=bsearch(out, arr[j]);
        	if (out[at]==arr[j]) res.push(arr[j]);
        }
        out=res;
    }
	return out;
}

export const lexiconXor=(lexicons:Lexicon[])=>{
	if (!lexicons || lexicons.length<2) return lexicons;
	const intersect=lexiconIntersect(lexicons);
	let out=[];

	for (let i=0;i<lexicons.length;i++) {
		const arr=unique(lexicons[i]);
		const res=[];
		for (let j=0;j<arr.length;j++) {
        	const at=bsearch(intersect, arr[j]);
        	if (intersect[at]!==arr[j]) {
        		res.push(arr[j]);
        	}
        }
		out=out.concat(res);
	}
	return out;
}