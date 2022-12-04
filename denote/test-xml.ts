import TDenList from './denlist.js';
let tests=0,passes=0;

const str='<p>Namo tassa <note><i>bhagavato </i></note>arahato sammāsambuddhassa</p>\n  <p>nikāyo</p>';
const vri=new TDenList(str,{akey:'vri',markup:'xml',lang:'iast'});

const str2=vri.serialize();
console.log(vri.data)
tests++; if (str==str2) passes++;

console.log('tests',tests,'passes',passes)