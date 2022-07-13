import {fromObj,alphabetically} from '../utils/sortedarray.ts';
import {humanBytes} from '../utils/index.ts';
import {makePitakaZip} from '../utils/lazip.ts'
export const writeChanged=(fn,buf,enc='utf8')=>{ //write to fn only if changed
    const oldbuf=fs.existsSync(fn) && fs.readFileSync(fn,enc);
    if (oldbuf!==buf) {
        fs.writeFileSync(fn,buf,enc);
        return true;
    }
    return false;
}

export const writeIncObj=(obj,outfn)=>{
    let arr=Array.isArray(obj)?obj:fromObj(obj,true);
    if (writeChanged(outfn,arr.join('\n'))) {
        console.log('written',outfn,arr.length)
    } else {
        console.log(outfn,'no difference')
    }
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
            if (writeChanged(outfn,buf)) {
                console.log('written',outfn,...humanBytes(buf.length));
            }
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