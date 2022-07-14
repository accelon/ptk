import {storeZip, ZipStore} from '../zip/index.ts';
import {LineBase} from '../linebase/index.ts';

const move000js=(sources)=>{ //make them close to central directory
	const out=sources.filter(it=>!it.name.endsWith('/000.js'));
	const js000=sources.filter(it=>it.name.endsWith('/000.js'));
	out.push(...js000);
	return out;
}
export const makePtk=(lbase:LineBase,comimage:Uint8Array) :Uint8Array=>{
	let sources=[] , locals=[];
	let zip,redbeanbuf;

	lbase.writePages((pagefn,buf)=>{
		sources.push({name:lbase.name+'/'+pagefn, content:new TextEncoder().encode(buf)});
	})

	if (comimage) { //copy all files from image, except the new ptk in lbase and config.js
		zip=new ZipStore(comimage); 
		redbeanbuf=new Uint8Array(comimage.subarray(0,zip.zipStart||0));
		for (let i=0;i<zip.files.length;i++) {
			const item=zip.files[i];
			if (sources.indexOf(item.name)==-1 && item.name!=='config.js') {
				sources.push(item);
			}
		}
	}

	//find out all ptk
	sources.forEach(it=>{
		if (it.name.endsWith('/000.js')) {
			const ptkname=it.name.slice(0,it.name.length-7);
			locals.push(ptkname);
		}
	});

	//move 000.js close to central directory, better chance to be loaded when open
	sources=move000js(sources);
	sources.push({name:'config.js',
		content:new TextEncoder().encode(`window.accelon22={locals:"`+locals.join(',')+'"}')});

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
