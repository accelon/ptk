/* browser should not include this file*/
import {fromObj,alphabetically} from '../utils/sortedarray.ts';
import {humanBytes} from '../utils/index.ts';
import {grey,green} from '../cli/colors.cjs'; // lukeed/kleur
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
export const writeChanged=(fn,buf,verbose=false,enc='utf8')=>{ //write to fn only if changed
    const oldbuf=fs.existsSync(fn) && fs.readFileSync(fn,enc);
    if (oldbuf!==buf) {
        fs.writeFileSync(fn,buf,enc);
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
    let s=fs.readFileSync(fn);
    //3 times faster than readFileSync with encoding
    //buffer is hold in C++ object instead of node.js heap
    s= new TextDecoder().decode(s); 
    if (s.charCodeAt(0)===0xfeff) s=s.slice(1); //BOM is okay, no memory write involved
    // DOS style crlf get 300% memory consumption penalty 
    if (s.indexOf('\r')>-1) s=s.replace(/\r?\n/g,'\n');
    return s;
}
export const readTextLines=(fn:string):string[]=>readTextContent(fn).split('\n');

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
        lbase.writePages((pagefn,buf)=>{
            const outfn=folder+'/'+pagefn;
            writeChanged(outfn,buf,true);
        }); 
    } else {
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


export {nodefs};