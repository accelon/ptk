import {stringifyLVA,parseLVA,digLVA,undigLVA} from '../nodebundle.cjs'
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0, lva;

lva=parseLVA('cyd:e#3715'); 
test++;pass+=lva.length==1&&lva[0].depth==0&&lva[0].host=='cyd'&&lva[0].ele=='e'

lva=parseLVA('cyd:ee3715'); //# is optional for numeric id
test++;pass+=lva.length==1&&lva[0].depth==0&&lva[0].host=='cyd'&&lva[0].ele=='ee'

lva=parseLVA('(e3715)');
test++;pass+=lva.length==1&&lva[0].depth==1&&!lva[0].host;

lva=parseLVA('e1 e2'); // space as delimeter
test++;pass+=lva.length==2;

lva=parseLVA('e1++++e2'); //+ serve as space
test++;pass+=lva.length==2;

//range compatible with slice
// 0123456789
// >xxxxxxxx   :1   from  從1開始顯示，~0 可不必寫
// xxxx<       <4   till  顯示小於4
// >xxx<       :1<4 只顯示 1,2,3 行
//  <x>        :2-3 只顯示 2 行

lva=parseLVA('e1:1');  //
test++;pass+=lva[0].from==1;

lva=parseLVA('e1<3');  
test++;pass+=lva[0].till==3;

lva=parseLVA('e1:1<3'); 
test++;pass+=lva[0].from==1;
test++;pass+=lva[0].till==3;

lva=parseLVA('e1<3:2'); //invalid address
test++;pass+=lva.length==0

lva=parseLVA('e1:1<1');  // zero line
test++;pass+=lva[0].from==1;
test++;pass+=lva[0].till==1;
 
lva=parseLVA('e1:2<1'); //adjust zero line
test++;pass+=lva[0].from==2;
test++;pass+=lva[0].till==2; 


lva=parseLVA('(cyd:e3715(e300) )'); //scope of cyd
test++;pass+=lva.length==2&&lva[0].host=='cyd';
test++;pass+=lva[1].host=='cyd';

lva=parseLVA('(cyd:e3715(abc:e300)e300  )'); //scope of cyd
test++; pass+=lva.length==3&&lva[0].host=='cyd';
test++; pass+=lva[1].host=='abc';
test++; pass+=lva[2].host=='cyd';

lva=parseLVA('(cyd:e3715(abc:e300 e400)e300  )'); // 
test++; pass+=lva.length==4&&lva[0].host=='cyd';
test++; pass+=lva[1].host=='abc';
test++; pass+=lva[2].host=='abc';
test++; pass+=lva[3].host=='cyd';

lva=parseLVA('(cyd:e3715(e300 abc:e400 e500 )e600  )'); // 
test++; pass+=lva.length==5&&lva[0].host=='cyd';
test++; pass+=lva[1].id=='300' && lva[1].host=='cyd'; //using the host of parent
test++; pass+=lva[2].id=='400' && lva[2].host=='abc'; //setting a new host
test++; pass+=lva[3].id=='500' && lva[3].host=='abc'; //same level sharnig host
test++; pass+=lva[4].id=='600' && lva[4].host=='cyd'; //parent scope

//dig and undig full node
let beforedig='cyd:e456';
let insertaddress='abc:w234';
let lva2=parseLVA(digLVA(beforedig,insertaddress));
test++; pass+=lva2.length==3;
test++; pass+=lva2[0].from==0;
test++; pass+=lva2[2].till==0;
test++; pass+=lva2[1].depth==1 ;

const stringified=lva2.map(it=>stringifyLVA(it));

test++; pass+=stringified.length==3 && stringified[1]==insertaddress ;
test++; pass+=stringified[0].startsWith(beforedig) ;

test++; pass+=undigLVA( stringifyLVA(lva2))==beforedig;


//dig and undig a range
beforedig='cyd:e1:3<6';  // from line 3 to line 4
lva2=parseLVA(digLVA(beforedig,insertaddress));
test++; pass+=lva2.length==3 ;
test++; pass+=lva2[0].from==3 ;
test++; pass+=lva2[0].till==4 ;
test++; pass+=lva2[2].from==4 ;
test++; pass+=lva2[2].till==6 ;

beforedig='cyd:e1:1<1';  // diging a one line just add after it
let afterdig=digLVA(beforedig,insertaddress);
lva2=parseLVA(afterdig);
test++; pass+=afterdig[afterdig.length-1]==')' && afterdig[afterdig.length-2]!==')'; //
test++; pass+=lva2.length==2 ;
test++; pass+=lva2[1].depth==lva2[0].depth+1;
test++; pass+=stringifyLVA(undigLVA(afterdig))==beforedig;

console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
