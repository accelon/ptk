import {storeZip, ZipStore} from '../zip/index.ts';
import {LineBase} from '../linebase/index.ts';

export const makePtk=(lbase:LineBase,comimage:Uint8Array) :Uint8Array=>{
	const sources=[] , locals=[];
	let zip,redbeanbuf;
	if (comimage) {
		zip=new ZipStore(comimage);
		redbeanbuf=new Uint8Array(comimage.subarray(0,zip.zipStart||0));
		sources.push(...zip.files.filter(it=>
			it.name!=='config.js'&& 
			!it.name.startsWith(lbase.name+'/') //remove the old version
		)); //copy all the files in the image, except ptk with same name and config.js
	}
	sources.forEach(it=>{
		if (it.name.endsWith('/000.js')) {
			const ptkname=it.name.slice(0,it.name.length-7);
			locals.push(ptkname);
		}
	});
	locals.push(lbase.name);

	sources.push({name:'config.js',
		content:new TextEncoder().encode(`window.accelon22={locals:"`+locals.join(',')+'"}')});

	lbase.writePages((pagefn,buf)=>{
		sources.push({name:lbase.name+'/'+pagefn, content:new TextEncoder().encode(buf)});
	})
	const newzipbuf = storeZip(sources, {reserve:zip?.zipStart||0});
	if (redbeanbuf) newzipbuf.set(redbeanbuf);
	else setPtkFileLength(newzipbuf);
	return newzipbuf;
}

//for chrome extension fetch to get the file size
export const setPtkFileLength=(buf:Uint8Array)=>{
    buf[7] |= 0x80 ; //set the flag , so that we know it is a pitaka zip
    const sizebuf=new Uint32Array([buf.length]);
    const sizebuf8=new Uint8Array(sizebuf.buffer);
    buf[10]=sizebuf8[0];  //Buffer.writeInt32LE(arr.length,0xA);
    buf[11]=sizebuf8[1];
    buf[12]=sizebuf8[2];
    buf[13]=sizebuf8[3];
}
