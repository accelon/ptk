/* convert bopomofo to pinyin */
//'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ',
//'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦㄧㄨㄩ'

const consonants= 'b,p,m,f,d,t,n,l,g,k,h,j,q,x,zh,ch,sh,r,z,c,s'.split(',');
const vowels0='a,o,e,eh,ai,ei,au,ou,an,en,ang,eng,er,i,u,iu'.split(',');
const vowels1='ā,ō,ē,ēh,āi,ēi,āu,ōu,ān,ēn,āng,ēng,ēr,ī,ū,iū'.split(',');
const vowels2='á,ó,é,éh,ái,éi,áu,óu,án,én,áng,éng,ér,í,ú,iú'.split(',');
const vowels3='ǎ,ǒ,ě,ěh,ǎi,ěi,ǎu,ǒu,ǎn,ěn,ǎng,ěng,ěr,ǐ,ǔ,ǚ'.split(',');
const vowels4='à,ò,è,èh,ài,èi,àu,òu,àn,èn,àng,èng,èr,ì,ù,iù'.split(',');
tonevowels=[vowels0,vowels1,vowels2,vowels3,vowels4];

export const toPinyin=(bopomofo:string)=>{
	let tone=1, out='';
	const tonecp=bopomofo.charCodeAt(bopomofo.length-1);
	if (tonecp==0x02ca) tone=2;
	else if (tonecp==0x02cb) tone=4;
	else if (tonecp==0x02c7) tone=3;
	const vowels=tonevowels[tone];
	if (tone!==1) bopomofo=bopomofo.slice(0,bopomofo.length-1);

	for (let i=0;i<bopomofo.length;i++) {
		const cp=bopomofo.charCodeAt(i);
		if (cp>=0x3105 && cp<=0x3119) { 
			out+=consonants[cp-0x3105]
		} else if (cp>=0x311a && cp<=0x3129) { 
			out+=(i<bopomofo.length-1)?vowels0[cp-0x311a]:vowels[cp-0x311a];
		}
	}
	out=out.replace('uē','ō').replace('uè','ò').replace(/^i/,'y');
	return out;
}