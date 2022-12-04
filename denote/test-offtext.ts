import TDenList from './denlist.js';
let tests=0,passes=0;

const str='^n3Namo tassa ^a^b^i[zh=如來 bhagavato]  arahato^c7^d8 sammāsambuddhassa nikāyo';
const cs=new TDenList(str,{akey:'cs',markup:'offtext',lang:'iast'});

// console.log(cs.data)
const str2=cs.serialize();
console.log(str)
console.log(str2)
console.log(cs.data)

tests++; if (str==str2) passes++;

console.log('tests',tests,'passes',passes)