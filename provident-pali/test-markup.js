import {lexify} from './lexification.js'
import {stringifyLex,parseLex,orthOf} from './lex.js'

const markupLex=lex=>{
	let s='';
	// <span>bO</span><span class="psandhi" s="jVJ">DI⧘a</span><span>NVg</span>
	let left,right;
	for (let i=1;i<lex.length/2;i+=2) {
		left=lex[i-1],right=lex[i+1];
		let leftpart='',rightpart='';
		let at1=left.indexOf('<');
		let at2=right.indexOf('>');
		if (at1>-1) {
			leftpart=left.slice(at1+1);
			left=left.slice(0,at1);
		}
		if (at2>-1) {
			rightpart=right.slice(0,at2);
			lex[i+1]=right.slice(at2+1);
		}
		const sep='⧘'
		const from=lex[i];
		const to=leftpart+sep+rightpart;
		s+=left+'^sandhi[from="'+from+'" '+to+']';
	}
	s+=lex[lex.length-1];
	return s;
}
const lex=parseLex('BErv3anNVgNA2aAkNVKEyVy0vtVTM');
console.log(lex)
console.log(markupLex(lex));