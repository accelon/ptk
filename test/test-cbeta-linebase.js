// 3 second to put taisho into zip ( 30more seconds to do zip compression)
// deflation should be done by 7z (59MB in 7z vs 93MB in zip)
import {bsearch,alphabetically0,writeChanged,packIntDelta,packBoolean,unpackBoolean,
	StringArray,LineBaser,storeZip,
	fromObj,splitUTF32Char,nodefs,humanBytes,readTextContent,readTextLines,isPunc} from "ptk/nodebundle.cjs"
let prevtiming='';
const showMemory=(stage)=>{
	console.log( stage,'memory usage, heap (in V8)',...humanBytes(process.memoryUsage().heapTotal), 
//memory hold by C++ object ( like Int32Array TextDecoder)
	', external (in C++)',...humanBytes(process.memoryUsage().external));
}
const run=async (stage,cb)=>{
	console.time(stage);
	await cb();
	console.timeEnd(stage);
	showMemory(stage);
}

console.time('all');
console.time('load')
await nodefs;
showMemory('init');
const srcfile='../cb-t-raw.off'; //
const rawcontent=readTextContent(srcfile);
const lines=new StringArray(rawcontent,true); //10% faster than split(/\n/), saving alot of fragement string
showMemory('rawtext');

const lbase=new LineBaser();
lbase.setName('cbeta');
console.timeEnd('load')
let linecount=0;
await run('lbase', ()=>{
	let line=lines.next();
	while (line || line===''){
		linecount++;
		lbase.append(line);
		line=lines.next();
	} 
	console.log('linecount',linecount,'pages',lbase.pagestarts.length)
});

const sources=[];
await run('writepages',async ()=>{
	lbase.dump((name,content)=>{
		//full taisho takes 500ms  to encode
		sources.push({name,  content: new TextEncoder().encode(content)});
	})
})

await run('write',async ()=>{
	const zipbuf=storeZip(sources);
	fs.writeFileSync('cbeta.zip' , zipbuf);
	console.log('written','cbeta.zip',  zipbuf.length);
})

console.timeEnd('all')