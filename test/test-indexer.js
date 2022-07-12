import {bsearch,alphabetically0,writeChanged,pack_delta,
	StringArray,
	fromObj,splitUTF32Char,nodefs,humanBytes,readTextContent,readTextLines,isPunc} from "ptk/nodebundle.cjs"

const showMemory=stage=>{
	console.log( stage,'heap',...humanBytes(process.memoryUsage().heapTotal))	
}
console.time('load')
await nodefs;
showMemory('init');
const srcfile='../cb-t-raw.off'; //
const ttfile=srcfile.replace('.off','.tsv');
const lines=new StringArray(readTextContent(srcfile),true); //10% faster than split(/\n/), saving alot of fragement string
showMemory('textlines');
let tokentable=fs.existsSync(ttfile)?readTextLines(ttfile):null;

if (tokentable) tokentable=tokentable.map(it=>it.split('\t') );

let tokenpos=0;
const buildTokenTable=()=>{
	const postingcount={};
	lines.reset();
	let line;
	do {
		line=lines.next();
		const tokens=splitUTF32Char(line);
		for (let j=0;j<tokens.length;j++) {
			const tk=tokens[j];
			if (isPunc(tk)) continue;
			const cp=tk.codePointAt(0);
			if (cp>=0x3400 && cp<=0x40000) {
				if (!postingcount[tk]) postingcount[tk]=0;
				postingcount[tk]++;
			}
		}
	} while (typeof line!=='undefined');
	const arr=fromObj(postingcount, (a,b)=>[a,b]);
	arr.sort(alphabetically0);
	return arr;
}
if (!tokentable) {
	tokentable=buildTokenTable(lines);
	writeChanged(ttfile, tokentable.map(it=>it.join('\t')).join('\n'))
}
let chpostings=new Array(65536), chtokencount= new Uint32Array(65536);
let tokens={}, postings , tokencount ;

if (tokentable) {
	const chtokentable=tokentable.filter(it=>it[0].length==1);
	for (let i=0;i<chtokentable.length;i++) {
		const [ch, size ] = chtokentable[i];
		const cp=ch.codePointAt(0);
		chpostings[cp]=new Uint32Array(size);
	}
	console.log('bmp count',chtokentable.length);

	tokentable=tokentable.filter(it=>it[0].length>1);
	postings=tokentable.map(it=>new Uint32Array(parseInt(it[1])));
	tokencount=new Uint8Array(tokentable.length);

	const tks=tokentable.map(it=>it[0]);
	for (let i=0;i<tks.length;i++) {
		tokens[tks[i]]=i;
	}

	console.log('long token count',tokentable.length);
}

const makeindex=()=>{
	lines.reset();
	let line;
	do {
		line=lines.next();
		const tks=splitUTF32Char(line);
		for (let j=0;j<tks.length;j++) {
			const tk=tks[j];
			if (isPunc(tk)) continue;
			const cp=tk.codePointAt(0);
			if (cp>=0x3400 && cp<0x10000) {
				chpostings[cp][ chtokencount[cp]]=tokenpos++;
				chtokencount[cp]++;
			} else if (cp>0xffff && cp<0x40000) {
				//const at=bsearch( tokens ,tk);
				const at=tokens[tk];
				// if (at>-1 && tokens[at]==tk) {
				if (at>-1){
					if (tokencount[at]<postings[at].length) {
					 	postings[at][ tokencount[at] ]=tokenpos++;	
					 	tokencount[at]++
					}
				}
			}
		}
	} while (typeof line!=='undefined')
}
console.timeEnd('load')
console.time('posting')
makeindex(lines,tokentable);
showMemory('posting');
console.timeEnd('posting');

console.time('pack');
const out=[];
let packedsize=0;
for (let i=0;i<chpostings.length;i++) {
	if (!chpostings[i]) continue;
	//原文刪去一些字，tokentable 沒更新, tokencount 會較小。
	//增加的字會找不到。
	const tks=chtokencount[i]<chpostings[i].length?chpostings[i].slice(0, chtokencount[i]):chpostings[i];
	const s=pack_delta(tks);
	packedsize+=s.length;
	out.push(s);
}
for (let i=0;i<postings.length;i++) {
	if (!postings[i]) continue;
	const tks=tokencount[i]<postings[i].length?postings[i].slice(0, tokencount[i]):postings[i];
	const s=pack_delta(tks);
	packedsize+=s.length;
	out.push(s);
}
console.timeEnd('pack');
showMemory('packed');

console.log('packedsize',...humanBytes(packedsize),'tokenpos',tokenpos,
',average bytes per tokenpos', (packedsize/tokenpos).toFixed(2))
//console.log(postings.slice(0,2))
//console.log(chpostings[0x4e00])

