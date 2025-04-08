/* browser should not include this file*/
import {fromObj} from '../utils/sortedarray.ts';
import {humanBytes} from '../utils/index.ts';
import {grey,green} from '../cli/colors.js'; // lukeed/kleur
export {filesFromPattern} from "./fsutils.ts"
export const makePitakaZip=async(arr:Uint8Array, writer)=>{
    arr[7] |= 0x80 ; //set the flag , so that we know it is a pitaka zip
    const sizebuf=new Uint32Array([arr.length]);
    const sizebuf8=new Uint8Array(sizebuf.buffer);
    arr[10]=sizebuf8[0];  //Buffer.writeInt32LE(arr.length,0xA);
    arr[11]=sizebuf8[1];
    arr[12]=sizebuf8[2];
    arr[13]=sizebuf8[3];
    if (writer) await writer(arr);
    return arr;
}

const samecontent=(a,b)=>{
    if (typeof a==='string' && typeof b==='string') {
        return a==b;
    }
    if (a instanceof Buffer && b instanceof Buffer) {
        return Buffer.compare(a,b);
    }
    return false;
}
export const writeChanged=(fn,buf,verbose=false,enc='utf8')=>{ //write to fn only if changed
    const oldbuf=fs.existsSync(fn) && (enc?fs.readFileSync(fn,enc):fs.readFileSync(fn));
    if (!samecontent(oldbuf,buf)) {
        enc?fs.writeFileSync(fn,buf,enc):fs.writeFileSync(fn,buf);
        if (verbose) console.log(green('written'),fn,...humanBytes(buf.length));
        return true;
    }
    if (verbose) console.log(grey('no diff'),fn,...humanBytes(buf.length));
    return false;
}

export const writeIncObj=(obj,outfn,verbose)=>{
    let arr=Array.isArray(obj)?obj:fromObj(obj,true);
    writeChanged(outfn,arr.join('\n'),verbose);
    return arr;
}

const nodefs=new Promise(resolve=>{
    if (typeof process!=='undefined' &&  parseInt(process.version.substr(1))>12) {
        import('fs').then(fs=>{
            global.fs=fs;
            import('path').then(p=>{
                global.Path=p;
            })
            resolve();
        })
    } else {
        resolve(null)
    }
})

export const readTextContent=(fn:string):string=>{
    let raw=fs.readFileSync(fn);
    //3 times faster than readFileSync with encoding
    //buffer is hold in C++ object instead of node.js heap
    const dv=new DataView(raw.buffer);
    const encoding=dv.getUint16(0)==0xfffe?'utf-16le':'utf-8'; //only support utf16 le and utf8
    const decoder=new TextDecoder(encoding);
    let s=decoder.decode(raw); 
    if (s.charCodeAt(0)===0xfeff) s=s.slice(1); //BOM is okay, no memory write involved

    // DOS style crlf get 300% memory consumption penalty 
    if (s.indexOf('\r')>-1) s=s.replace(/\r?\n/g,'\n');
    return s;
}
/* read one or more files and split into array of string */
export const readTextLines=(fn:[string|string[]],format=''):string[]=>{
    let files=fn;
    if (typeof fn=='string') {
        files=[fn];
    }
    let out=[];
    for (let i=0;i<files.length;i++) {
        const arr=readTextContent(files[i]).split('\n');
        if (format=='tsv') {
            out=out.concat(arr.map(it=>it.split('\t')));
        } else out=out.concat(arr);
    }
    return out;
};

export const writePitaka=async (lbase,opts={})=>{
    const name=opts.name|| lbase.name;
    const compression=opts.compress?'DEFLATE':'STORE';
    lbase.setName(name);
    if (opts.jsonp) {
        const folder=(opts.folder||name);
        if (name) lbase.setName(name);
        if (!fs.existsSync(folder)) {
            try{
                fs.mkdirSync(folder);
            } catch(e) {
                console.log('cannot create folder',name);
            }
        }
        lbase.dumpJs((pagefn,buf)=>{
            const outfn=folder+'/'+pagefn;
            writeChanged(outfn,buf,true);
        }); 
    } else if (opts.JSZip) {
        const zip=new opts.JSZip();
        await lbase.writePages(async (pagefn,buf)=>{
            const outfn=name+'/'+pagefn;
            await zip.file(outfn,buf, {compression});
        })
        console.log('writing',name+'.ptk');
        makePitakaZip(zip, async (buf)=>{
            console.log('ptk length',buf.length)
            await fs.promises.writeFile(name+'.ptk',buf);

        });
    }
}

export const deepReadDir = async (dirPath) => await Promise.all(
  (await fs.promises.readdir(dirPath)).map(async (entity) => {
    const path = dirPath+'/'+entity
    const stat=await fs.promises.lstat(path);
    return stat.isDirectory()|| stat.isSymbolicLink()? await deepReadDir(path) : path
  })
);

export const  fetchFile=async (url,fn)=>{
    const at=url.lastIndexOf('/')
    fn=fn||url.slice(at+1);
    let content;
    if (!fs.existsSync(fn)) {
        console.log('fetching',url);
        const k=await fetch(url);
        content=Buffer.from(await k.arrayBuffer(),'utf8').toString();
        writeChanged(fn,content,true);
    }  else {
        content=readTextContent(fn);
    }
    return content;
}
export {nodefs};