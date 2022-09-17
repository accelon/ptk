// import {Lexicon} from './lexicon.js';

export const setup=async ()=>{
};

/*
   lexicon
      lemma : 字屬性陣列。lemma 是無法再拆分的factor

   factorized : 長詞的因式分解式字 (最短拆分)，文字儲存格式。

   decomposition:
      復合字： 拆分建議陣列。原形


decompostion: (會有中間compound)
sammāsambuddha=sammā-sambuddha
不存 sammāsambuddhehi, 等變化
未來優化：如果可以輕易完美分解的不必存。
        輕易完美分解，就是lexicon 只有 sammā，而無 sammāsa ，切掉sammā後，sambuddha 也存在

拆分步驟：
input: sammāsambuddhaṃ
decomposition 找不到
根據規則, 去尾 得sammāsambuddha
找到了.
sammāsambuddha=sammā-sambuddha
把尾巴補上得sammā-sambuddhaṃ


CS 建置時
   超長詞預先拆分  ( longcompound.json )


   參考 decompose 拆分成 因式分解

KMJ 存在時。


iticīticeva   
iti-cīti-ceva      最短拆分 因式分解

ceva = ca+-eva
cīti = ca+2iti     a+2i ==> ī 去 a

*/