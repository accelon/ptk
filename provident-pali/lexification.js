import {NormLexeme,DeNormLexeme} from './lexeme.js';
import {sbProvident,mbProvident} from './sandhi.js'
/*
  根據 正詞和詞件陣列，分解出 左字後綴 , 連音 ,右字前綴 。
  偶數為詞件，奇數元素為連音。  >< 刪除的部分
  輸入： pdOpm , ['pd','upm']
  輸出： [ "pd", "O" , "u>pm" ] 

  這是詞件式的展開型。
  不考慮連音是否符合規則。
*/
const tryLexeme=(lx,i,orth,prev,final,verbose)=>{
		let cap=false,alpha=false;
		if (i&&lx.slice(0,2)=='aA') {
			alpha=true; //獨字時多出的 a, parseFormula 時補上
			lx=lx.slice(1);	
		}
		verbose&&console.log(lx,orth)

		let at1=orth.indexOf(lx.slice(0,lx.length-1),prev);//開頭符合
		let at2=-1;
		if (i) {
			 at2=orth.indexOf(lx.slice(1,lx.length-1),prev) //從第2字開始符合
		}
		if (at2>-1 && orth.slice(at2)[1]=='V' && lx.length<3) { //workaround for sIAlbVbt=sIAl3bt 
		 	 const at3=orth.indexOf(lx.slice(lx.length-1),at2+1); //should not match bV
		 	 if (at3>-1 && lx.length<3) {
		 	 		at2=at3;
		 	 		at1=-1;
		 	 }
		}

    //deal with 'cEv',['c','ev']  , e=>E 
		if (i&&at1==-1 && at2>-1) { //try auto capitalize following lexeme
			if (lx.charAt(0).match(/[eiuoūīā]/) ) {
				lx=lx.charAt(0).toUpperCase()+lx.slice(1);
				cap=true; //開頭的元音轉大寫
				//try again
				at1=orth.indexOf(lx.slice(0,lx.length-1),prev);//開頭符合				
			}
		}



		verbose&&console.log('try lexeme',lx,at1,at2,orth.slice(at2),alpha)


		return [at1,at2,cap,alpha,lx]
}
export const lexify=(mborth,lexemes,verbose)=>{
	let orth=sbProvident(mborth);
	let prev=0,	out=[]	,sandhi='',cap=false,alpha=false, lexeme='', extra='',normed=false;
	for (let i=0;i<lexemes.length;i++) {
		const final=lexemes.length-1 ==i;
		let lx=sbProvident(lexemes[i]);
		let at1,at2;
		[at1,at2,cap,alpha,lx]=tryLexeme(lx,i,orth,prev, final,verbose);
		if (at1==-1 && at2==-1) { //no match , try NormLexeme
			if (NormLexeme[lexemes[i]]) {
				lx=sbProvident(NormLexeme[lexemes[i]]);
				normed=true;
				[at1,at2,cap,alpha,lx]=tryLexeme(lx,i,orth,prev,final, verbose);
			}
		}

		let at=-1;
		if (~at1) at=at1;
		else if (~at2 && i) at=at2;

		if (at==-1) {
			out.push(-1);//fail marker
			return out;			
		}
		const plast=lx[lx.length-1];
		let samelast=false;
		verbose&&console.log(i,'o',lx,'at',at,'at1/2',at1,at2,orth.slice(at),prev,orth.slice(prev))
		const orth_at_lexemefirst=orth.slice(at-1,at);
		if (~at1) {
			let eaten=0;
			let sandhi=orth.slice(prev,at1);

			if (sandhi.charAt(sandhi.length-1)=='V') { //eat one more char for combining consonant
				 sandhi+=orth.charAt(at1);
				 eaten=1;
			}
			if (sandhi==='a') sandhi=''; //workaround for bhUaAgtO=bhU0aAgtO , double vowel
			
			i&&out.push(extra+sandhi);//sandhi
			// verbose&&extra+sandhi&&console.log('sandhi',extra,'sandhi',sandhi,prev,at1)
			let lastidx=at1+lx.length-1;
			if (lastidx>=orth.length)lastidx=orth.length-1;
			const olast = orth[lastidx];
			lexeme=lx;
			if (eaten) {
				lexeme=lx.slice(0,eaten)+'>'+lx.slice(eaten);
			}
			if (olast===plast) { //no remain
				samelast=true;
			} else {
				verbose&&console.log('plast',plast,'olast',olast, orth.slice(at1))
				lexeme=lexeme.slice(0,lexeme.length-1)+'<'+plast;
			}

		} else if (~at2 && i) {
			const samehead=orth.slice(prev,at2+1)===lx.charAt(1);
			let sandhi=orth.slice(prev,at2);
			if (!sandhi && !samehead) { 
				sandhi=orth.slice(prev,at2+1);
				verbose&&console.log('empty sandhi, eat one more',sandhi)
				at2++;
			}
			const lxch0=lx.charAt(0);

			if (sandhi.charAt(sandhi.length-1)=='V') {
				sandhi+=orth.charAt(at2)
				at2--;
			}
			const olast = orth[at2+lx.length-2];
			let sdhi=sandhi!==lx.charAt(1)?extra+sandhi:'';
			out.push(sdhi);
			// verbose&&console.log('last',olast,plast,at1)
			if (olast===plast) {
				samelast=true;
				lexeme=lx.charAt(0)+'>'+lx.slice(1);
				// prev+=lx.length-1 + sdhi.length;  //如果有sdhi ，表示替代，必須補回，否則at1 找不到
			} else {
				lexeme=lx.charAt(0)+'>'+lx.slice(1,lx.length-1)+'<'+plast;
			}
		}

		if (cap) lexeme=lexeme.charAt(0).toUpperCase()+lexeme.slice(1);
		if (alpha) {
			/* if orth is keeping the a , double vowel  */
			lexeme= ((orth_at_lexemefirst=='a')?'a':'A') +lexeme;
			alpha=false;
		}

		if(extra) extra='';
		if (normed&&DeNormLexeme[lexeme]!==lexeme) {
			  const dlexeme=DeNormLexeme[lexeme];
		    out.push(dlexeme||lexeme);
		    if (dlexeme) {
			    let at=dlexeme.indexOf('<');
					if (at>0) extra=lexeme.slice(at);
			    at=dlexeme.indexOf('>');
					if (at>0) { //patch the sandhi before (for udayabbaya)
						const e=lexeme.slice(0, at );
						out[out.length-2]+=e;
					}
		    }
		    normed=false;
		} else {
				out.push(lexeme);	
		}
		prev=at+lx.length-1;
		if (at!==at1&&at==at2) prev--;
		if (samelast) prev++;
		// verbose&&console.log('ORTH',prev,lx,'at',at,orth.slice(prev),'samelast',samelast,'at',at,at1,at2)

	}
	return out.map(mbProvident);
}