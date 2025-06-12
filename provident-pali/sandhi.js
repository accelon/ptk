export const InsertRules={'65':'A'};
const InsertRuleReverse={};
export const Rules={ //規則號不得為 0,1,2
// A+B=C    A<B=C   A>B=C    A-B=C
//   C        AC     BC       ACB     替換結果
//
	'a<A=A':'3',
    'a<A=m':'4',
	'a<A=Vv':'5',
	'a<A=d':'6',
	'a-A=r':'7',
	'a<A=t':'9',
	'a-AA=r':'3',
	'a<I=E':'3',
	'a<I=A':'4',
	'a<I=IA':'5',
	'a-I=y':'6',
	'a-I=m':'7',

	'a<E=E':'3',
	'a<E=A':'4',
	'a-E=d':'5',
	'a-E=m':'6',
	'a-E=y':'7',
	'a<E=':'8',
	'a<g=gVg':'3', //因為不是 gVG ，所以無法 autorule
	'a<g=NVg':'4',
	'a<p=pVp':'3',

	'a<U=O':'3',
	'a<U=A':'4',
	'a<U=U':'5',
	'a<U=UA':'6',
	'a<O=U':'3',

	'a<Ū=UA':'3', //左邊的 UA 要用 Ū 表示，但sandhi 不用
	'a<Ī=IA':'4',  // IA 也是 ， 
	'a<Ī=E':'5',
	'a<t=nVt':'4', 
	'a<v=bVb':'5',

	'A<AA=':'3',  //但 AA 不轉為 Ā
	'A+U=UA':'3',
	'A+I=IA':'3',
	'A+I=E':'4',
	'A-I=y':'5',
	'A-I=r':'6',
	'A-I=t':'7',
	'A-E=y':'4',
	'A<A=y':'3',
	'A<A=m':'4',
	'A+A=E':'5',
	'A+A=A':'6',
	'A+A=':'7',
	'M>AA=m':'3',  //kImAnIsMs << kIM-aAnIsMs, remove left, keep right
	'M+A=A':'3',
	'M+A=m':'4',
	'M+A=d':'5',
	'M+A=':'6',
	'M+A=nA':'7',
	'M+E=A':'3',
	'M+b=bVb':'3',
	'M+U=UA':'3',
	'M+I=IA':'3',
	'M+I=I':'4',
	'M>I=y':'5',
	'M+I=':'6',
	'M+Ī=A':'3',
	'M+g=NVg':'3',
	'M+p=pVp':'3',
	'M+k=NVk':'3',
	'M+J=jVJ':'3',
	'M+X=WVX':'3',
	'M+y=YVY':'3',//sukhaññeva=sukhaṃ-yeva


	'I+I=IA':'3',
	'I+I=E':'4',
	'I-I=y':'5',
	'I-I=r':'6',
	'I+A=jVJ':'2', //this is a special rule for bodhi+anga
	'I+A=IA':'3',
	'I+A=A':'4',
	'I+A=Vy':'6',
    'I<A=m':'7',
	'I<A=y':'8',
	'I<A=r':'9',
	'I+A=':'10',

	'I<d=nVd':'3',
	'I+U=UA':'3',
	// 'I>aA=':'3',  //use 1 instead
	'I+AA=I':'4',
	'I-AA=r':'5',
	'I<AA=':'6', //kucchisayā=kucchi-āsayā

	'I>E=Vv':'3',
	'I>E=Vp':'4',
	'I-E=d':'5',
	'I-E=m':'7',
	'I-E=r':'8',
	'I<D=nVD':'3',
	'I>t=IA':'3', //只有接 t可能長音化
	'I>k=IA':'3', //長音化
	'Ī+A=A':'3',
	'Ī+U=UA':'3',

	'U+A=UA':'3', //長音化
	'U+A=Vv':'4',
	'U+A=A':'5',
	'U+A=VvA':'6',
	'U+A=O':'7',
	'U+A=':'8',

	'U+I=U':'3',
	'U+I=O':'4',
	'U+I=UA':'5',
	'U+U=UA':'3',
	'U-U=h':'4',
	'U>E=Vv':'3',
	'U-E=d':'4',
	'U-E=r':'5',
	'U>AA=Vv':'3',
	'U<v=bVb':'3',
	'U<D=nVD':'3',
	'U>t=UA':'3', //長音化
	'U<t=tVt':'4',
	'U<tA=tVt':'4',
	'E+A=A':'3',
	'E+A=Vy':'4',
	'E+A=VyA':'5',
	'E>AA=Vy':'5',
	'E+A=':'6',
	'E+U=UA':'3',
	'E-I=r':'3',

	'O+A=':'3',
	'O+A=Vv':'4',
	'O+A=A':'5',
	'O+A=VvA':'6',
	'O>I=Vv':'3',
	'O-I=r':'4',
	'O>E=Vv':'3',
	'O-E=y':'4',
	'O-E=v':'5',
	'O>AA=Vv':'3',
	'O-U=v':'3',//vammikovupacīyati=vammiko-upacīyati
	'V+A=':'3',
	'V+A=A':'4',
	'V+U=UA':'3',


// might be vri typo , need to fix original text
	'V+v=':'4',   //sātaccamuccati=sātaccam-vuccati
	'M+v=m':'4' , //nibbānamuccati [ 'nibbānaṃ', 'vuccati' ]

 	'a<s=r':'9',//pahūtarattaratanāya [ 'pahūta', 'satta', 'ratanāya' ]

	//reserve rules
	//01 => A insert A

	// 'y+v=bVb':'2', //this is a special rule for udaya+vaya  ==>udayabbaya

}
const PAIRING='|', EQUAL='='; //pairing left and right as a search key
export const ELIDENONE=0,ELIDELEFT=1, ELIDERIGHT=2 ,ELIDEBOTH=3;
export const RuleKeys={[ELIDENONE]:'-',[ELIDELEFT]:'>',[ELIDERIGHT]:'<',[ELIDEBOTH]:'+'};
export const RuleKeysRegEx=/([<>\-+])/
export const JoinTypes={};
const BuildRules=()=>{
	for (let rule in Rules) {
		const joiner=Rules[rule]; // then join operator
		if (!JoinTypes[joiner]) JoinTypes[joiner]={};

		const at=rule.indexOf(EQUAL);
		const sandhi=rule.slice(at+1);
		const [left,elision,right]=rule.slice(0,at).split(RuleKeysRegEx);

		const pair=left+PAIRING+right;
		if (JoinTypes[joiner][pair]) console.log('key ',pair,'exists')
		JoinTypes[joiner][pair]=elision+sandhi; //left is not elided
	}
	for (let joiner in InsertRules) {
		InsertRuleReverse[InsertRules[joiner]]=joiner;
	}
}
BuildRules();

export const isAssimiliar=(right,sandhi)=>{
	if ( sandhi.length!==3 || sandhi[1]!=='V' || right[0]!==sandhi[2]) return false;
	if (sandhi[0].match(/[ckgjbptdms]/) && (right[0]==sandhi[2] || right[0]==sandhi[2].toLowerCase()) ) return true;

	if (right[0]=='Q' || right[0]=='X' || right[0]=='F' || right[0]=='Q'|| right[0]=='Y') return true;
}
export const getRule=(left,right,leftconsumed,rightconsumed,sandhi,verbose)=>{
	if ( !leftconsumed && !rightconsumed){
		if (!sandhi) return 0;//nothing to do
		const joiner=InsertRuleReverse[sandhi];
		// console.log('jointer',joiner,leftconsumed,rightconsumed,left,right)
		if (joiner) return joiner;
	}

	let rulekey=RuleKeys[ELIDENONE];
	if (rightconsumed && !leftconsumed) rulekey=RuleKeys[ELIDERIGHT]
	else if (leftconsumed && !rightconsumed) rulekey=RuleKeys[ELIDELEFT];
	else if (rightconsumed && leftconsumed) rulekey=RuleKeys[ELIDEBOTH];

	let key=left+rulekey+right+EQUAL+sandhi;

	let r=Rules[key];

	if (!r && rulekey==RuleKeys[ELIDEBOTH]) { //for ['kImAnIsMs',['kIM','aAnIsMs'],'kIM3AAnIsMs',['kI<M','m','AAnIsMs']],
		key=left+RuleKeys[ELIDELEFT]+right+EQUAL+sandhi;
		r=Rules[key]
		if (!r) {
			key=left+RuleKeys[ELIDENONE]+right+EQUAL+sandhi;
		}
	}

	if (!sandhi && !right && (!left||left==='a')) return ELIDENONE;
	if (!sandhi && right==='') return ELIDELEFT;
	if (!sandhi && (left===''||left==='a') && !right) return ELIDERIGHT;

	verbose&&console.log('RR ',right,sandhi,'assim',isAssimiliar(right,sandhi))
	//try assimilization rule

	if (!r && isAssimiliar(right,sandhi)) {
		if (isVowel(left)) r=ELIDEBOTH;
		else if (left.match(/[AIUOE]$/)) r=ELIDERIGHT;//default keeping the stem
	}
	return parseInt(r)||ELIDENONE;
}

export const getLeft=str=>{
	const at=str.lastIndexOf('<');
	return ~at?str.slice(at+1):'';
}
export const getRight=str=>{
	const at=str.indexOf('>');
	return ~at?str.slice(0,at):'';
}

export const getTailSyl=str=>{ //return vowel
	const ch1=str.slice(str.length-1), ch2=str.slice(str.length-2);
	if (ch2==='IA') return 'Ī'
	else if (ch2==='UA') return 'Ū'
	else if (ch1==='E') return 'E'
	else if (ch1==='O') return 'O'
	else if (ch1=='A') return 'A'
	else if (ch1=='I') return 'I'
	else if (ch1=='U') return 'U'
	else if (ch1=='V') return 'V'
	else if (ch1=='M') return 'M'
	return 'a';
}

export const getHeadSyl=str=>{ //return vowel or consonant
	const ch1=str.slice(0,1), ch2=str.slice(0,2);
	if (ch2==='aA') return 'aA'; //not changing, becuase a is dropped automatically
	else if (ch2==='AA') return 'AA';
	else if (ch2==='iA' || ch2=='IA') return 'Ī';
	else if (ch2==='uA' || ch2=='UA') return 'Ū';
	else if (ch1==='ū') return 'Ū';
	else if (ch1==='ī') return 'Ī';
	else if (ch1.toLowerCase()==='a') return 'A';
	else if (ch1.toLowerCase()==='u') return 'U';
	else if (ch1.toLowerCase()==='i') return 'I';
	else if (ch1.toLowerCase()==='o') return 'O';
	else if (ch1.toLowerCase()==='e') return 'E';
	else return ch1+(ch2[1]=='A'?'A':''); //because 
}

export const sbProvident=str=>{ //convert long vowel to single byte, for easier comparison
	return str.replace(/UA/g,'Ū').replace(/IA/g,'Ī')
	.replace(/iA/g,'ī').replace(/uA/g,'ū')
	// .replace(/aA/g,'ā')
}

export const mbProvident=str=>{//convert single byte vowel back to provident format
	return str.replace(/Ū/g,'UA').replace(/Ī/g,'IA')
	.replace(/ī/g,'iA').replace(/ū/g,'uA')
	// .replace(/ā/g,'aA')
}

export const getAssimiliar=w=>{
	let out='';
	const m=w.match(/^([KGCJPBTDkgcjpbmtds])/);
	if (m)	return m[1].toLowerCase()+'V'+m[1][0];
	else if (w[0]=='Q') return 'FVQ';
	else if (w[0]=='F') return 'FVF';
	else if (w[0]=='W') return 'WVW';
	else if (w[0]=='X') return 'WVX';
	else if (w[0]=='Y') return 'YVY';
}
const sameAlpha=(v1,v2)=>{
	if (v1.match(/[aeiouAEIUO]/)) return v1.toUpperCase()===v2.toUpperCase();
	return v1===v2;
}
export const isVowel=s=>!!s.match(/^[aeiouīūāŪĪĀAEIOU]/);
export const isConsonant=s=>!isVowel(s);


export const getJoinType=(jt,left,right,verbose)=>{
	let join=parseInt(jt);
	const jtypes=JoinTypes[join];
	const L=getTailSyl(left),R=getHeadSyl(right);


	if (InsertRules[jt]) {
		 return {keepRight:true,keepLeft:true,sandhi:InsertRules[jt],join:0,rightconsumed:0,leftconsumed:0};
	}

	let sandhi ,keepLeft=(join==ELIDERIGHT||join==ELIDENONE)
	,keepRight=(join==ELIDELEFT || join==ELIDENONE);
	let adv=0,autorule=false;
	if (join>=ELIDEBOTH) {
		sandhi=jtypes[left+PAIRING+R];
		if (typeof sandhi==='undefined' && isConsonant(left)) { 
			sandhi=jtypes[L+PAIRING+R];
		}
	}

	if (typeof sandhi=='undefined') {
		if (jt==ELIDEBOTH || jt==ELIDERIGHT) {
			const assim=getAssimiliar(right);
			verbose&&console.log('assim',assim,right,jt)
			if (assim) {
				if (jt==ELIDERIGHT && sandhi) sandhi='<'+sandhi;
				verbose&&console.log('auto sandhi',sandhi)
				autorule=true;
				sandhi=assim;				
			}
		}
	}
	if (!sandhi)sandhi='';

	if (sandhi) {
		const elision=sandhi[0];
		if (elision==RuleKeys[ELIDENONE]) {keepLeft=true;keepRight=true;}
		else if (elision==RuleKeys[ELIDERIGHT]) keepLeft=true;
		else if (elision==RuleKeys[ELIDELEFT] ) keepRight=true;
		if (elision.match(RuleKeysRegEx)) sandhi=sandhi.slice(1);
	}
	verbose&&console.log('sandhi',sandhi,'keepLeft',keepLeft,'keepRight',keepRight)

	//autorule keep left, consume right
	let leftconsumed=(!autorule &&(!keepLeft  || join===ELIDELEFT) )?left.length:0; //vowel only , can do toLowerCase

	if (leftconsumed>1) leftconsumed=1;
	
	const rightconsumed=!keepRight&&((join===ELIDERIGHT ||join>=ELIDEBOTH)|| !sameAlpha(right,R) || autorule)?right.length:0;
	verbose&&console.log('rightconsumed',rightconsumed,'autorule',autorule)
	// verbose&&console.log('leftconsumed',leftconsumed,left.length,(join===ELIDERIGHT ||join===ELIDEBOTH||right.toUpp))

	return {keepRight,keepLeft,sandhi,join,rightconsumed,leftconsumed}
}