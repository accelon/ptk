//全大正藏 索引時間十秒以內
import {bsearch,alphabetically0,writeChanged,packIntDelta,packBoolean,unpackBoolean,
	StringArray,
	fromObj,splitUTF32Char,nodefs,humanBytes,readTextContent,readTextLines,isPunc} from "ptk/nodebundle.cjs"

const showMemory=stage=>{
	console.log( stage,'heap',...humanBytes(process.memoryUsage().heapTotal))	
}
console.time('all');
console.time('load')
await nodefs;
showMemory('init');
const srcfile='../cb-t-raw.off'; //
const ttfile=srcfile.replace('.off','.tsv');
const rawcontent=readTextContent(srcfile);
const lines=new StringArray(rawcontent,true); //10% faster than split(/\n/), saving alot of fragement string

showMemory('textlines');
// let tokentable=fs.existsSync(ttfile)?readTextLines(ttfile):null;
// array of [ token ,tokencount] 
// 幫助indexer 預先配置固定長度的陣列

// if (tokentable) tokentable=tokentable.map(it=>it.split('\t') );

let tokenpos=0 ;
let unigram=new Int32Array(65536);
let tokenlist=new Int32Array(rawcontent.length);

let ngramcount=0;
let ngram={}, postingcount=[];
const buildTokens=()=>{
	lines.reset();
	let line;
	do {
		line=lines.next();
		const tokens=splitUTF32Char(line);
		for (let j=0;j<tokens.length;j++) {
			const tk=tokens[j];
			if (isPunc(tk)) {
				continue;
			}
			const cp=tk.codePointAt(0);
			if (cp>=0x3400 && cp<=0x10000) {
				unigram[cp]++;
				tokenlist[tokenpos++]=cp;
			} else if (cp>=0x10000){
				let at=ngram[tk];
				if (typeof at=='undefined') {
					at=ngramcount;
					postingcount.push(0);
					ngram[tk]=at;
					ngramcount++;
				}
				postingcount[at]++;
				tokenlist[tokenpos++] = at + 65536;
			}  
		}
	} while (typeof line!=='undefined');
	// const arr=fromObj(postingcount, (a,b)=>[a,b]);
	// for (let i=0x3400;i<unigram.length;i++) {
	// 	if (unigram[i]) arr.push( [String.fromCodePoint(i) , unigram[i]])
	// }
	//arr.sort(alphabetically0);
}
console.timeEnd('load');//大約 2~3秒 耗266mb
// if (!tokentable) {
console.time('tokenize')
buildTokens(); 

showMemory('tokenize');
	// tokentable=buildTokenTable(lines); //11秒左右，不太佔記憶體
	// writeChanged(ttfile, tokentable.map(it=>it.join('\t')).join('\n'))
console.timeEnd('tokenize')
// }
//BMP 不用bsearch，快十倍以上。
//字的分布較平均，90% 以上是空的，用RLE壓縮率很高 ( 稀疏布林陣列 )
//[false,false,true,true,true,false,true,true]
//==> [2,3,1,2] // 2 false, 3 true, 1 false ,2 true
// ==> [-1,-1,1,2,3,-1,3,4] // -1 表示無postings\
//最壞 情況 true,false 交互，64KB 。
console.time('allot');
let chpostings=new Array(65536), chtokencount= new Int32Array(65536);
const postings=new Array(ngramcount);
console.log('ngramcount',ngramcount,'tokenpos',tokenpos)
for (let i=0;i<ngramcount;i++) {
	postings[i] = new Int32Array( postingcount[i]);
}
for (let i=0;i<unigram.length;i++) {
	if (unigram[i]) {
		chpostings[i] = new Int32Array( unigram[i]);	
	}
}
showMemory('allot');
console.timeEnd('allot');

const tokencount=new Int32Array(ngramcount);
const makeindex=()=>{
	for (let i=0;i<tokenpos;i++){
		let code=tokenlist[i];
		if (code<0x10000) {
			if (chpostings[code]) {
				chpostings[code][ chtokencount[code]]=i;
				chtokencount[code]++;
			}
		} else if (!isNaN(code)) {
			const at = code-65536;
			postings[at][ tokencount[at] ]=i;	
			tokencount[at]++	
		}
	}
}
const pack=()=>{
	const out=[];
	let packedsize=0;
	for (let i=0;i<chpostings.length;i++) {
		if (!chpostings[i]) continue;
		//原文刪去一些字或者用全集tokentable 但只索引子集，tokentable 沒更新, tokencount 會較小。
		//增加的字會找不到。
		const s=packIntDelta(chpostings[i]);
		packedsize+=s.length;
		out.push(s);
	}
	for (let i=0;i<postings.length;i++) {
		if (!postings[i]) continue;
		const s=packIntDelta(postings[i]);
		packedsize+=s.length;
		out.push(s);
	}
	return [out,packedsize];
}

console.time('posting');//大約 4秒  228mb ( gc 未動作則445mb)
makeindex();
showMemory('posting');
console.timeEnd('posting');

console.time('pack');
const [out,packedsize]=pack(); // 2秒以內， 313mb，
console.timeEnd('pack'); 
showMemory('packed'); 

console.timeEnd('all'); //  9.2 second
console.log('packedsize',packedsize,'tokenpos',tokenpos,
',average bytes per tokenpos', (packedsize/tokenpos).toFixed(2))
//console.log(postings.slice(0,2))
//console.log(chpostings[0x4e00])

