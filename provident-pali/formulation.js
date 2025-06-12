import {getRule,getLeft,getRight,getHeadSyl,getTailSyl,getJoinType,
	ELIDENONE,ELIDELEFT,ELIDERIGHT,ELIDEBOTH,sbProvident,mbProvident} from './sandhi.js'
import {DeNormLexeme,NormLexeme,samecount,sameendcount} from './lexeme.js'
/*
  將詞件展開式與字串式的轉換，字串式一定可以展開，反之不然。
  字串式以數字分隔詞件，連音從數字和前後字元，按照規則產生。
*/

/** formulate lex to a string*/
export const formulate=(lex,verbose)=>{
	let out='';
	if (lex.length<3) return ''
  if (lex.length%2==0) return '';
	for (let i=0;i<lex.length;i++) {
		if (i%2) {
			const sandhi=lex[i]||'';
			const leftconsumed=lex[i-1].indexOf('<')>-1;
			const rightconsumed=lex[i+1].indexOf('>')>-1;
			const leftv=getTailSyl(lex[i-1].replace('<',''));
			const rightv=getHeadSyl(lex[i+1].replace('>',''));

			let rule=getRule(leftv,rightv,leftconsumed,rightconsumed,sandhi,verbose);
			verbose&&console.log('RULE', rule,leftv,'+',rightv,'='+sandhi,verbose)
			if (rule===ELIDENONE) {
				const left=getLeft(lex[i-1]);
				const right=getRight(lex[i+1]);
				if ( (left && left!=='a') && !right) rule=ELIDELEFT;
				else if (right && !left) rule=ELIDERIGHT;
			}
			if (sandhi && rule==ELIDENONE) rule=ELIDEBOTH;
			verbose&& console.log('formulate',leftv,rightv,'sandhi',sandhi,'rule',rule)
			out+=rule;
		} else {
			let lexeme=lex[i].replace('>','').replace('<','');
			lexeme=DeNormLexeme[lexeme]||lexeme;
			out+=lexeme;
		}
	}
	return out;
}
export const parseFormula=(_str,verbose)=>{
	const out=[];
	let prev=0, str=sbProvident(_str),
	consumedhead='', //被吃掉的頭
	extra='';
	if (parseInt(_str).toString()==_str) return [];
	const addLexeme=lexeme=>{
		lexeme=lexeme.replace(/^\d/,'').replace(/\d$/,'');//prevention
		if (lexeme.match(/\d/)) {
			 if (lexeme.indexOf('<')>-1 || lexeme.indexOf('>')>-1) {
			 	  console.log('error single char lexeme',_str,lexeme);
			 } else {
			 	  const p=parseFormula(lexeme.replace());
			 	  out.push(...p);
			 }
		} else out.push(lexeme);
	}

	const prevLexeme=(idx, last='',join)=>{
		const len=consumedhead.length;
		consumedhead='';
		let lexeme=len?str.slice(prev,prev+len)+'>'+str.slice(prev+len,idx):str.slice(prev,idx);
		// if (lexeme.charAt(0)==='A') lexeme='a'+lexeme;
		lexeme+=last;

		const nlexeme=NormLexeme[lexeme.replace('>','').replace('<','')];
		if (nlexeme) {
			  lexeme=lexeme.replace('<',''); //workaround for bODI bOjVJ 
				const cnt = samecount(nlexeme,lexeme);
				if (cnt&&join) { //only apply when join is not 0
					lexeme=lexeme.slice(0,cnt)+'<'+lexeme.slice(cnt);
					extra=nlexeme.slice(cnt);
				} else {
					const cnt=sameendcount(nlexeme,lexeme);
					if (cnt) {
						lexeme=lexeme.replace('>','');
						lexeme=lexeme.slice(0,lexeme.length-cnt)+'>'+lexeme.slice(lexeme.length-cnt);
						out[out.length-1]+=nlexeme.slice(0,nlexeme.length-cnt);
					}
				}
		} 
		return lexeme;
	}

	str.replace(/([a-zA-ZĪŪ])(\d+)([a-zA-ZĀĪŪāūī])/g,(m,left,jt,right, idx)=>{
		// eat one more char for leading long A, other vowel UA/IA converted one char Ū Ī
		let adv=0;
		if ( (right=='a'||right=='A') && str[idx+m.length]==='A' ) {
		   right+='A';
		   adv=1;
		}
		const {join,sandhi,rightconsumed,leftconsumed}=getJoinType(jt,left,right,verbose);
		verbose&&console.log('sandhi',sandhi,'join',join,'left',left,'right',right,'consumed l',leftconsumed,'r',rightconsumed);

		let lexeme=leftconsumed?prevLexeme(idx,(idx&&join?'<':'')+left,join): prevLexeme(idx,left,join);

		addLexeme(lexeme)

		out.push(extra+sandhi);

		extra='';
		
		consumedhead=rightconsumed?right:'';
		// verbose&&console.log('rightconsumed',rightconsumed)	
		if (join===ELIDERIGHT) idx-=left.length; //沒用到的左邊，補回長度
		else if ( !rightconsumed ||join===ELIDELEFT||join===ELIDENONE) idx-=right.length; //沒用到的右邊，補回長度
		else {
			idx-=right.length;
			verbose && console.log('right',right,'prev',idx+m.length,rightconsumed,left,sandhi)
		}
		prev=idx+m.length+adv;
		verbose&&console.log('prev',prev,str.slice(prev))
	})
	const lexeme=prevLexeme(str.length);
	addLexeme(lexeme);

	return out.map(mbProvident);
}

/** 返回 展開式的 正字*/
export const orthOf=(lex,verbose)=>{
	if (typeof lex==='string') {
		lex=parseFormula(lex);
		if (lex.length<3) return '';
	}

	if (lex.length==1) return lex.join('');
	else if (lex.length==2) {
		console.log('wrong lex', lex)
		return '';
	}

	//leading a of each lexeme is elided, excerpt the first one
	// const lead_aa=lex[0].slice(0,2)==='aA';
	
	// let s=(lead_a?'a':'')+
	let s=lex.map(it=>it!==-1&&it.replace(/<.+$/,'').replace(/^.+>/,'')
		.replace(/^AA/,'A')) //AA to be combined with left consonant,   aA standalone double vowel 
		// .replace(/^([eiuo])/
		// ,(m,m1)=>m1.toUpperCase())
	.map((it,idx,self)=>( (self[idx+1]&&NormLexeme[it]) ||it))
	 //change to normLexeme only when sandhi exist 
	 // ( sambodhi has no sandhi/sambojjha has sandhi), but lexeme is always sambodhi
	.join('');
	// if (lead_aa) s='aA'+s.slice(1);

	if (s.match(/^[AEIOU]/)) s=s.charAt(0).toLowerCase()+s.slice(1);


	return s;
}
const LEXEME_SPLIT='/'
export const lexemeOf=(lex,splitchar=LEXEME_SPLIT)=>{
	let s='';

	if (typeof lex==='string') {
		s=lex.replace(/\d+/g,splitchar)
	} else {
		for (let i=0;i<lex.length;i+=2) {
			if (i) s+=splitchar;
			s+=lex[i].replace(/[><]/g,'');
		}
	}

	//auto convert following lexeme first vowel to lowercase.
	s=s.replace(/(.)([AEIOU])/g,(m,m1,m2)=>m1==splitchar?m1+m2.toLowerCase():m1+m2);

	return s
}