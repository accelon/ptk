// 3 second to put taisho into zip ( 30more seconds to do zip compression)
// deflation should be done by 7z (59MB in 7z vs 93MB in zip)
import {bsearch,alphabetically0,writeChanged,packIntDelta,packBoolean,unpackBoolean,
	StringArray,LineBase,
	fromObj,splitUTF32Char,nodefs,humanBytes,readTextContent,readTextLines,isPunc} from "ptk/nodebundle.cjs"
import JSZip from 'lazip';
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


const zip=new JSZip();
const writer=async (fn,buf)=>{
	await zip.file(fn,buf,{compression:"STORE"})
}
const lbase=new LineBase();
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


let arrbuf;
await run('zipgen',async ()=>{
	arrbuf=await zip.generateAsync({type:'arraybuffer'});

})

await run('write',()=>{
	console.log(lbase.pagestarts)
	// if (writeChanged('cbeta.zip' , new Uint8Array(arrbuf),'utf8')){
	// 	console.log('written','cbeta.zip', arrbuf.byteLength);
	// } else {
	// 	console.log('zip untouch')
	// }

})

console.timeEnd('all')