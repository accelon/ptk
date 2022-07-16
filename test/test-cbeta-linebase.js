// 3 second to put taisho into zip ( 30more seconds to do zip compression)
// deflation should be done by 7z (59MB in 7z vs 93MB in zip)
import {bsearch,alphabetically0,writeChanged,packIntDelta,packBoolean,unpackBoolean,
	StringArray,LineBaser,storeZip,
	fromObj,splitUTF32Char,nodefs,readTextContent,readTextLines,isPunc,
runTest, showMemory} from "ptk/nodebundle.cjs"
let prevtiming='';

console.time('all');
console.time('load')
await nodefs;
showMemory('init');
const srcfile='../cli/cb-t-raw.off'; //
const rawcontent=readTextContent(srcfile);
const lines=new StringArray(rawcontent,{sequencial:true}); //10% faster than split(/\n/), saving alot of fragement string
showMemory('rawtext');

const lbase=new LineBaser();
lbase.setName('cbeta');
console.timeEnd('load')
let linecount=0;
await runTest('lbase', ()=>{
	let line=lines.next();
	while (line || line===''){
		linecount++;
		lbase.append(line);
		line=lines.next();
	} 
	console.log('linecount',linecount,'pages',lbase.pagestarts.length)
});

const sources=[];
await runTest('writepages',async ()=>{
	lbase.dump((name,content)=>{
		//full taisho takes 500ms  to encode
		sources.push({name,  content: new TextEncoder().encode(content)});
	})
})

await runTest('write',async ()=>{
	const zipbuf=storeZip(sources);
	fs.writeFileSync('cbeta.zip' , zipbuf);
	console.log('written','cbeta.zip',  zipbuf.length);
})

console.timeEnd('all')