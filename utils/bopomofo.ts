/* convert bopomofo to pinyin */
//'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ',
//'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ'

const consonants= 'b,p,m,f,d,t,n,l,g,k,h,j,q,x,zh,ch,sh,r,z,c,s'.split(',');
const vowels='a,o,e,e,ai,ei,ao,ou,an,en,ang,eng,er,i,u,v'.split(',');

export const toPinyin=(bopomofo:string)=>{
	let tone='', out='',vowel=false;
	const tonecp=bopomofo.charCodeAt(bopomofo.length-1);
	if (tonecp==0x02ca) tone=2;
	else if (tonecp==0x02cb) tone=4;
	else if (tonecp==0x02c7) tone=3;

	for (let i=0;i<bopomofo.length;i++) {
		const cp=bopomofo.charCodeAt(i);
		if (cp>=0x3105 && cp<=0x3119) { 
			out+=consonants[cp-0x3105]
		} else if (cp>=0x311a && cp<=0x3129) { 
			out+=vowels[cp-0x311a];
			vowel=true;
		}
	}
	if (out.length==1 && out=='u') out='wu'
	out=out.replace(/^i/,'yi').replace(/^v/,'yu').replace(/^u/,'w')
	.replace('qv','qu')
	.replace('xv','xu')
	.replace('jv','ju')
	.replace('ieng','ing')
	.replace('xiu','xu')
	.replace('niu','nu')
	.replace('ien','in')
	.replace('iou','iu')
	.replace('iuan','uan')
	.replace('ueng','ong')
	.replace('uen','un')
	.replace('uei','ui')
	.replace('qo','qio')
	.replace('xo','xio')
	.replace('jo','jio')
	.replace('yia','ya')
	.replace('yie','ye')
	.replace('yio','yo')
	.replace('yiu','you')
	+(vowel?'':'i')+tone;
	return out;
}