import {LVA} from '../nodebundle.cjs'
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0, lva;

lva=LVA.parse('cyd:e#3715'); 

test++;pass+=lva.length==1&&lva[0].depth==0&&lva[0].host=='cyd'&&lva[0].eleid=='e#3715'

lva=LVA.parse('cyd:ee3715'); //# is optional for numeric id
test++;pass+=lva.length==1&&lva[0].depth==0&&lva[0].host=='cyd'&&lva[0].eleid=='ee3715'

lva=LVA.parse('(e3715)');
test++;pass+=lva.length==1&&lva[0].depth==1&&!lva[0].host;

lva=LVA.parse('e1 e2'); // space as delimeter
test++;pass+=lva.length==2;

lva=LVA.parse('e1++++e2'); //+ serve as space
test++;pass+=lva.length==2;

//range compatible with slice
// 0123456789
// >xxxxxxxx   :1   from  從1開始顯示，~0 可不必寫
// xxxx<       <4   till  顯示小於4
// >xxx<       :1<4 只顯示 1,2,3 行
//  <x>        :2-3 只顯示 2 行

lva=LVA.parse('e1:1');  //
test++;pass+=lva[0].from==1;

lva=LVA.parse('e1<3');  
test++;pass+=lva[0].till==3;

lva=LVA.parse('e1:1<3'); 
test++;pass+=lva[0].from==1;
test++;pass+=lva[0].till==3;

lva=LVA.parse('e1<3:2'); //invalid address
test++;pass+=lva.length==0

lva=LVA.parse('e1:1<1');  // zero line
test++;pass+=lva[0].from==1;
test++;pass+=lva[0].till==1;
 
lva=LVA.parse('e1:2<1'); //adjust zero line
test++;pass+=lva[0].from==2;
test++;pass+=lva[0].till==2; 


lva=LVA.parse('(cyd:e3715(e300) )'); //scope of cyd
test++;pass+=lva.length==2&&lva[0].host=='cyd';
test++;pass+=lva[1].host=='cyd';

lva=LVA.parse('(cyd:e3715(abc:e300)e300  )'); //scope of cyd
test++; pass+=lva.length==3&&lva[0].host=='cyd';
test++; pass+=lva[1].host=='abc';
test++; pass+=lva[2].host=='cyd';

lva=LVA.parse('(cyd:e3715(abc:e300 e400)e300  )'); // 
test++; pass+=lva.length==4&&lva[0].host=='cyd';
test++; pass+=lva[1].host=='abc';
test++; pass+=lva[2].host=='abc';
test++; pass+=lva[3].host=='cyd';

lva=LVA.parse('(cyd:e3715(e300 abc:e400 e500 )e600  )'); // 
test++; pass+=lva.length==5&&lva[0].host=='cyd';
test++; pass+=lva[1].eleid=='e300' && lva[1].host=='cyd'; //using the host of parent
test++; pass+=lva[2].eleid=='e400' && lva[2].host=='abc'; //setting a new host
test++; pass+=lva[3].eleid=='e500' && lva[3].host=='abc'; //same level sharnig host
test++; pass+=lva[4].eleid=='e600' && lva[4].host=='cyd'; //parent scope

//dig and undig full node
lva=new LVA('cyd:e456');
let insertaddress='abc:w234';

let nodes=lva.dig(insertaddress).nodes();
test++; pass+=nodes.length==3;
test++; pass+=nodes[0].from==0;
test++; pass+=nodes[2].till==0;
test++; pass+=nodes[1].depth==1 ;

const stringified=nodes.map(it=>LVA.stringify(it));

test++; pass+=stringified.length==3 && stringified[1]==insertaddress ;

lva=new LVA('cyd:e1:1<1');  // diging a one line just add after it
nodes=lva.dig(insertaddress).nodes();
const afterdig=lva.stringify();
test++; pass+=afterdig[afterdig.length-1]==')' && afterdig[afterdig.length-2]!==')'; //
test++; pass+=nodes.length==2 ;
test++; pass+=nodes[1].depth==nodes[0].depth+1;

//hide eleid of right part 
lva = new LVA('cyd:e3715<1(e6582<1(e4480):1+e2075):1');
test++; pass+=lva.nodes().length==6;
console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
console.log(lva.stringify());
