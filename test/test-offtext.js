/*
   offtext   = plaintext + tags
   plaintext 搜尋引擎觀點的正字串。
   tags      從正字串抽離的標籤
             加入新的tag（如互文連結、搜尋結果） ，不改變正字串。
*/
import {stripOfftag,Offtext} from '../nodebundle.cjs'
let test=0,pass=0;
let plain,tags,str,ot,attrs,a,b,c,d,e;


//最簡單的標記形式，空白之後是純文字
ot=new Offtext('^a text');
pass+= (ot.plain==' text' && ot.tags.length==1 && ot.tags[0].name=='a')?1:0 ;test++;

//^之後一踫到英文小寫或_ 就是標記 
ot=new Offtext('^a text^_b');
pass+= (ot.plain==' text' && ot.tags.length==2 &&ot.tags[0].name=='a'&& ot.tags[1].name=='_b')?1:0 ;test++;

plain=stripOfftag('^a abc'); //for indexing
pass+=plain==' abc'?1:0;test++;

//大寫和中文不視為標記
str='^ABC^中文';
ot=new Offtext(str);
pass+= (ot.plain===str && ot.tags.length==0)?1:0 ;test++;

//屬性以 < > 包夾，語法同HTML ，唯少了元素名及空元素結束符 />
ot=new Offtext('^a<b=1 c=2>');attrs=ot.tags[0].attrs;
pass+= (attrs.b=='1')?1:0 ;test++;

//三種特殊屬性，= 可省略, # 為 id 簡寫 ，生效範圍 ~ 會刪除
ot=new Offtext('^a<~範圍 @位址 #ID>');attrs=ot.tags[0].attrs;
pass+= (attrs['~']=='範圍' && attrs['@']=='位址' && attrs.id=='ID')?1:0 ;test++;

//重複賦值，後者會覆蓋，不警告。
ot=new Offtext('^a<id=ID1 id=ID2>');attrs=ot.tags[0].attrs;
pass+= (attrs.id=="ID2")?1:0 ;test++;

//有半形空白的值要用" "
ot=new Offtext('^a<key="value with space">');attrs=ot.tags[0].attrs;
pass+= (attrs.key=="value with space")?1:0 ;test++;

//與html 同，只有屬性名，值為true。
ot=new Offtext('^a<checked>');attrs=ot.tags[0].attrs;;
pass+= (attrs.checked===true)?1:0 ;test++;

//如果有 = ，值為空字串
ot=new Offtext('^a<checked=>');attrs=ot.tags[0].attrs;;
pass+= (attrs.checked==='')?1:0 ;test++;
 
// 數字開頭id可縮寫，  ^a[id=123n] 等效於，不轉為數字，可直持BigInt及float
ot=new Offtext('^a123n文');attrs=ot.tags[0].attrs;;
pass+= (attrs.id==='123n')?1:0 ;test++;
 
//縮式id 必須以 a-z 或數字開頭，之後可以有 . _ -
ot=new Offtext('^a1.1文');attrs=ot.tags[0].attrs;
pass+= (attrs.id==='1.1')?1:0 ;test++;
ot=new Offtext('^a1-1文');attrs=ot.tags[0].attrs;
pass+= (attrs.id==='1-1')?1:0 ;test++;
ot=new Offtext('^a1_1文');attrs=ot.tags[0].attrs;
pass+= (attrs.id==='1_1')?1:0 ;test++;

// _ 會視為 tagname 的一部份。
ot=new Offtext('^a_1文');a=ot.tags[0];
pass+= (a.name==='a_' && ot.tags[0].attrs.id==='1')?1:0 ;test++;


//非數字id前面加 #  ^a[id=s123]
ot=new Offtext('^a#s123');a=ot.tags[0];
pass+= (a.attrs.id==='s123')?1:0 ;test++;

//中文可直接在標記之後
ot=new Offtext('^a中');
pass+= (ot.plain=='中' && ot.tags.length==1 && ot.tags[0].name=='a')?1:0 ;test++;

//英文小寫不要空白，則用空屬性隔開
ot=new Offtext('^a<>x');a=ot.tags[0];
pass+= (ot.plain=='x' && ot.tags.length==1 && a.name=='a')?1:0 ;test++;

//utils/cjk.ts # openBrackets 定義可接受的中文括號，特徵是 unicode codepoint +1
//所有的全形括號(「『（︹︵｛︷【︻《〈︽︿﹁﹃﹙﹛﹝‘“〝 可包夾文字，半形只可用()
str='^b「加粗」體字'; //」的codepoint 是「 +1
ot=new Offtext(str); a=ot.tags[0]
//以 tagText 取得 tag 包夾的文字
pass+= ( ot.tagText(a)=='「加粗」')   ?1:0 ;test++;
//或以 tag index

str='^u(斜體)字'; //」的codepoint 是「 +1
ot=new Offtext(str); a=ot.tags[0]
pass+= ( ot.tagText(0)=='(斜體)')   ?1:0 ;test++;

//以往後2個正字
str='qq^b~2粗體字'; 
ot=new Offtext(str); a=ot.tags[0]
pass+= ( ot.tagText(a)=='粗體')   ?1:0 ;test++;

//surrogate 視為一字
str='qq^b~2𠀀體字'; 
ot=new Offtext(str); a=ot.tags[0]
console.log(ot.tagText(a,true))
pass+= ( ot.tagText(a)=='𠀀體')   ?1:0 ;test++;

//以往後2個正字，被標記隔開沒關係
str='qqqqqqq^b~2粗^i7~1體字字字字字'; 
ot=new Offtext(str); b=ot.tags[0], c=ot.tags[1];
pass+= ( ot.tagText(b,true)=='粗^i7~1體')   ?1:0 ;test++;
pass+= ( ot.tagText(c,true)=='體')   ?1:0 ;test++;
pass+= ( ot.tagText(b)=='粗體')   ?1:0 ;test++;

//帶屬性及包夾文字
str='^a<href=xxx>「連結」文字'; 
ot=new Offtext(str);a=ot.tags[0];
pass+= (a.attrs.href='xxx' && ot.tagText(a)=='「連結」')   ?1:0 ;test++;


//包夾文字可交疊
str='qq^a「可^b1<x>『疊」的文^ee123字』xxxxxx';   
    '0123456789 ab cdef 012'
//   qq「可『疊」的文字』xx
//       4       11
ot=new Offtext(str); 
[a,b,e]=ot.tags; 
//第二參數為true ，取回原始字串(避免使用)
pass+= ( ot.tagRawText(a)=='「可^b1<x>『疊」' ) ?1:0 ;test++;
pass+= ( ot.tagRawText(b)=='『疊」的文^ee123字』' ) ?1:0 ;test++;
//已剖的（不含其他標記) , raw=false 預設行為
pass+= ( ot.tagText(a)=='「可『疊」' ) ?1:0 ;test++;
pass+= ( ot.tagText(b)=='『疊」的文字』' ) ?1:0 ;test++;
 


//用 ~終字表達範圍
str='qq^a<~止>直到這裡為止。';
ot=new Offtext(str); a=ot.tags[0];
pass+= ( ot.tagText(a)=='直到這裡為止' ) ?1:0 ;test++;

//交疊情況
str='qq^a<~為止>到^b<key=value ~！>這裡為止。^c<~。>另一句！';
ot=new Offtext(str);
[a,b,c]=ot.tags;
pass+= ( ot.tagText(a)=='到這裡為止' ) ?1:0 ;test++;
pass+= ( ot.tagText(b)=='這裡為止。另一句！' ) ?1:0 ;test++;
pass+=(!a.attrs['~'] && a.end>a.start)?1:0;test++  //生效的終字會被刪除
pass+=(!b.attrs['~'] && b.end>b.start)?1:0;test++  //生效的終字會被刪除
pass+=(c.attrs['~']=='。' && c.start==c.end)?1:0;test++  //未找到的終字保留


str='qq^a<~複+2>重複再重複又重複用加位數字表示跳過幾次';
ot=new Offtext(str); a=ot.tags[0];
pass+= ( ot.tagText(a)=='重複再重複又重複' ) ?1:0 ;test++; //跳過前兩個「重複」。 +0

str='qq^a<~複+0>重複再重複又重複用加位數字表示跳過幾次'; //+0 跳過0次，就表示一找到就停下來。等效於「~重複」
ot=new Offtext(str); a=ot.tags[0];
pass+= ( ot.tagText(a)=='重複' ) ?1:0 ;test++; 

//todo , serializer


console.log('pass',pass,'test',test);