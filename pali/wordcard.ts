/* return basic word information */

import {setup} from './mockdata.js';
// await setup();


export const getFactors=pli=>{ //取得因式分解 , 即最短拆分

}
export const getOrthograph=factored=>{ //從因式分解還原為正字拼法 

}
export const getWordInfo=pli=>{
	let root,partofspeech,stem,tense,gender,number,cas,person,meaning='',derivations,samebase;

	return {
		root, //詞根
		partofspeech,//詞品
		stem, //詞幹尾 a , i 
		//活用		能, 能反
		tense,//時態
		gender,number,case:cas,person,//性,數,格|人稱
		meaning,
		derivations, //所有的延伸字 清單
		samebase,    //相同前綴的字 
	}
}