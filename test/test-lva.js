import {stringifyLVA,parseLVA,splitLVA,joinLVA} from '../nodebundle.cjs'
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

//range
// 0123456789
// <xxxxxxxx   <1   表示不顯示小於1的行
// xxxx>       >3   表示不顯示超過3的行
// <xxx>       <1>3 只顯示 1,2,3 行
//  <x>        <2>2 只顯示 2 行

lva=parseLVA('e1<1');  //
test++;pass+=lva[0].left==1;

lva=parseLVA('e1>3');  
test++;pass+=lva[0].right==3;

lva=parseLVA('e1<1>3'); 
test++;pass+=lva[0].left==1;
test++;pass+=lva[0].right==3;

lva=parseLVA('e1>1<2'); //invalid address
test++;pass+=lva.length==0

lva=parseLVA('e1<1>1'); //at least one line
test++;pass+=lva[0].left==1;
test++;pass+=lva[0].right==1;
 
lva=parseLVA('e1<2>1'); //adjust right
test++;pass+=lva[0].left==2;
test++;pass+=lva[0].right==2; 

lva=parseLVA('e1<2>0'); //>0 無作用
test++;pass+=lva[0].left==2;
test++;pass+=lva[0].right==0; 

lva=parseLVA('e1<0>2'); //<0 無作用
test++;pass+=lva[0].left==0;
test++;pass+=lva[0].right==2; 


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

//split and join full node
let beforesplit='cyd:e1';
let insertaddress='abc:w2';
let lva2=splitLVA(beforesplit,insertaddress);
test++; pass+=lva2.length==3;
test++; pass+=lva2[0].right==1;
test++; pass+=lva2[2].left==1;
test++; pass+=lva2[1].depth==1 ;

const stringified=stringifyLVA(lva2);

test++; pass+=stringified.length==3 && stringified[1]==insertaddress ;
test++; pass+=stringified[0].startsWith(beforesplit) ;

test++; pass+=stringifyLVA(joinLVA(lva2))==beforesplit;


test++; pass+=joinLVA(lva)==null

//split and join a range
beforesplit='cyd:e1<3>6';  // from line 3 to line 4
lva2=splitLVA(beforesplit,insertaddress);

test++; pass+=lva2.length==3 ;

test++; pass+=lva2[0].left==3 ;
test++; pass+=lva2[0].right==4 ;
test++; pass+=lva2[2].left==4 ;
test++; pass+=lva2[2].right==6 ;

beforesplit='cyd:e1<1>1';  // spliting a one line just add after it
lva2=splitLVA(beforesplit,insertaddress);
test++; pass+=lva2.length==2 ;
test++; pass+=lva2[1].depth==lva2[0].depth+1;

test++; pass+=stringifyLVA(joinLVA(lva2))==beforesplit;


console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
