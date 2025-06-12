
import {sc2tc} from './sc-tc-map.js'
const mapping=sc2tc.split(/\r?\n/);
mapping.push('“「')
mapping.push('‘『')
mapping.push('”」')
mapping.push('’』')
/*
伪=偽僞   //對應兩個繁體字
㐷=傌     //gb 與 big5 一對一 (繁體無㐷字)
杰~傑     //繁體有「杰」字
*/


const overwrite= 
{"获":"獲穫","缰":"繮韁","赝":"贋贗","伪":"僞偽","汇":"匯彙","坛":"壇罈","台":"臺颱檯"
,"冲":"沖衝","硷":"礆鹼","绱":"緔鞝","脏":"臟髒","谫":"謭譾","钩":"鈎鉤","鿭":"鉨鑈",
"锈":"銹鏽","闲":"閑閒", "须":"須鬚", "鳄":"鰐鱷"}
const t2s={}, t2s_unsafe1={} ,  s2t={};
mapping.forEach((line,idx)=>{
	const r=line.match(/(.)(<?)(.+)/u);
	if (!r) throw 'wrong data format '+idx
	let [m,sc, op,tc]=r;
	let oldtc=tc;
	if (overwrite[sc]) tc=overwrite[sc];

	if (op=='') {
		if (tc.length==1) {//完美一對一 //左邊的字只有gb收，右邊只有big5收
			t2s[tc]=sc;
		} else {
			if (tc[0]=='>') { //只有4個   着>著 , 坂>阪
				t2s_unsafe1[tc.substring(1)]=sc; 
			} else {  //假設只有
				//历歷曆  , 发髮發 , 脏臟髒
				t2s[tc[0]] = sc;        //第一個繁體可以安全轉到簡體
				tc=tc.substring(1);
				for (let i=0;i<tc.length;i++) { //目前只有一個
					const cp=tc.codePointAt(i); //考慮未來 surrogate
					if (!cp) break;
					t2s_unsafe1[String.fromCodePoint(cp)] =sc ;
				} 
			}
		}
	} else { 
		if (tc.length==1) {  // 圣聖  听聽  同衕  云雲  松鬆  体體  咸鹹
			t2s_unsafe1[tc] = sc;  //簡字也在big5中
		} else {      
			while (tc&&tc[0]!=='>') {//干幹>乾  台臺<颱檯 
				//接受 幹=>干 ,臺=>台 
				const ch=String.fromCodePoint(tc.codePointAt(0));
				t2s_unsafe1[ ch ] = sc;
				tc=tc.substring(ch.length);
			}
			//最後剩六組  干乾  后後  复覆 征徵  于於  么幺麽
			//繁體都收，不轉換
		}
	}
	tc=oldtc.replace(/\>/g,'');
	if (op=='<') {
		s2t[sc]=tc.replace(sc,'')+sc; //簡字也可能是繁字 ， 簡字「面」 可能是繁字的「麵」或「面」
	} else s2t[sc]=tc;
});

export const toSim=(s,mode=1)=>{
	if (!s) return s;
	let out='',i=0;
	if (!mode) return s;
	while (i<s.length){
		const cp=s.codePointAt(i);
		const ucs4=String.fromCodePoint(cp);
		if (!ucs4)break;
		let sc=t2s[ucs4];
		if (mode==2&& !sc) sc=t2s_unsafe1[ucs4];
		out+= sc || ucs4;
		i++;
		if (cp>0xffff) i++;
	}
	return out;
}
export const fromSim=(s,mode=1,bracket='()')=>{ 
	let out='',i=0;
	if (!mode||!s) return s;
	while (i<s.length && s[i]){ //對每一個ucs4
		const cp=s.codePointAt(i);
		const ucs4=String.fromCodePoint(cp);
		if (!ucs4)break;
		let tc=s2t[ucs4];
		if (!tc) {
			out+=ucs4; //沒有繁體
		} else if (mode==1 && !tc.codePointAt(1) )  { //一對一
			out+=tc;
		} else if (mode==2) { 
			out+=String.fromCodePoint(tc.codePointAt(0));        //選第一個
		} else if (mode==3){  //展開
			if (tc.codePointAt(1)) out+=bracket[0]+tc+bracket[1];
			else out+=tc;
		} else out+=ucs4; //保留不變
		i++;
		if (cp>0xffff) i++;
	}
	return out;
}