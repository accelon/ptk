import {parseFormula,orthOf,LEX_REG_G, lexemeOf} from 'provident-pali' 
/* cannot work in side offtag */
const markupLex=(lex,showlexeme)=>{
	let s='',left,right;
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
		const sep=showlexeme?'⧘':'⦙';
		const s1=lex[i];
		const s2=leftpart+sep+rightpart;
		s+=left+'^'+(showlexeme?'p':'')+'sandhi[repl="'+(showlexeme?s1:s2)+'" '+ (showlexeme?s2:s1) +']';
	}
	s+=lex[lex.length-1];
	return s;
}
export const langSplitChar=palitrans=>{
	return {'':'⧘','iast':'·',tb:'࿒'}[palitrans]||'-'; //⫶ ┆  ⧘ ⦙
}
export const REG_PALI_SPACE_SPLIT=/([ ⧘\-࿒·])/
export const factorizeText=(str, mode , palitrans) =>{
	if (!str) return str;
	const splitchar=langSplitChar(palitrans);
	return str.replace(LEX_REG_G,(m,m1,idx)=>{
		if (m1.length<4 || str[idx-1]==='#'||str[idx-1]==='^') return m1;
		const lex=parseFormula(m1);
		// if (palitrans) 
		return mode?lexemeOf(lex, splitchar):orthOf(lex);
		// return 
	})
}
export default {factorizeText}