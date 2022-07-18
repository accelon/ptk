import {Compiler} from '../nodebundle.cjs';
let test=0,pass=0;

let lexicon=`^_<ptk=cyd type=tsv name=lemma>	orth=number/[012]	id=unique_number	syn=keys	ant=keys	rel=keys
一丁不識	3	1860			
一事未成	1	2654			一事無成`

let src=`^_<ptk=cyd zh=教育部成語典>
^:e<caption=詞目 id=unique_number syn=keys:lemma ant=keys:lemma rel=keys:lemma>
^:cf<id>
^e2654【一事未成】
猶^cf5「一事無成」。見^cf5「一事無成」條。
①唐．劉得仁〈寄無可上人〉詩：「省學為詩日，宵吟每達晨。十年期是夢，一事未成身。」
^e1860<rel=不識一丁>【一丁不識】
猶^cf3416「目不識丁」。見^cf3416「目不識丁」條。
①宋．吳編修〈八聲甘州．繫酒船夜入古江樓〉詞：「歎從前眼底，一丁不識，四海曾空。」
②《醒世姻緣傳》第一回：「那邢生後來做到尚書的人品，你道他眼裡那裡有你這個一丁不識的佳公子？」
^e【不識一丁】
`
const C=new Compiler(); 
C.compileBuffer(lexicon,'1lemma.tsv');
pass+= C.errors.length==2?1:0;test++;
if (C.errors.length>0) pass+= C.errors[0].line==1?1:0;test++; // 3 dones't match number[012]
if (C.errors.length>1) pass+= C.errors[1].line==2?1:0;test++; //一事無成 no key
C.reset(); 

lexicon=lexicon.replace('一丁不識	3','一丁不識	1'); //fix error
lexicon+='\n一事無成	2	944'; //add missing entry

C.compileBuffer(lexicon,'1lemma.tsv');
pass+= C.errors.length==0?1:0;test++;
 
C.compileBuffer(src,'cyd')
console.log(C.errors)
console.log(C.typedefs)
console.log('pass',pass,'test',test)