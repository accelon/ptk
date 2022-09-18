import {fromObj,alphabetically} from '../utils/sortedarray.ts';
import {humanBytes} from '../utils/index.ts';
import {grey,green} from '../cli/colors.cjs'; // lukeed/kleur

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
export const glob=(files,filepat)=>{
    if (typeof files=='string') {
        files=fs.readdirSync(files);
    }
    let start,end;
    if (!filepat) return files;
    const m=filepat.match(/\{(\d+)\-(\d+)\}/);
    if (m) {
        start=parseInt(m[1]);
        end=parseInt(m[2]);
        filepat=filepat.replace(/\{\d+\-\d+\}/,'(\\d+)');
    }
    const pat=filepat.replace(/\*/g,'[^\\.]+').replace(/\./g,'\\.').replace(/\?/g,'.');

    const reg=new RegExp(pat);

    if (start && end) {
        return files.filter(f=>{
            const m= f.match(reg);
            return m&& (parseInt(m[1])>=start && parseInt(m[1])<=end) ;
        })
    } else {
        return files.filter(f=>f.match(reg));
    }
}
const hasWildcard=s=>{
    return s.indexOf('?')>-1||s.indexOf('[')>-1||s.indexOf('*')>-1||s.indexOf('$')>-1||s.indexOf('{')>-1;
}
const expandWildcard=(folder,pat,isDir)=>{
    let files=[];
    if (hasWildcard(pat)) {
        const folderfiles=fs.readdirSync(folder);
        files=glob(folderfiles,pat);
    } else if (fs.existsSync(folder+pat)){
        files=[pat];
    }
    if (isDir) files=files.filter(fn=>fs.statSync(folder+fn).isDirectory())
    return files;
}
export const filesFromPattern=(pat,rootdir='')=>{
    const outfiles={};
    const patterns=(typeof pat==='string')?pat.split(/[;,]/):pat;
    if (rootdir&&rootdir.slice(rootdir.length-1)!=='/') rootdir+='/';

    patterns.forEach(pat=>{
        const at=pat.lastIndexOf('/');
        let dir='';
        let subfolders=[''];
        if (at>-1) {
            dir=pat.slice(0,at);
            pat=pat.slice(at+1);
            subfolders=expandWildcard(rootdir,dir,true);
        } else {
            subfolders=['']
        }
        
        subfolders.forEach(subfolder=>{
            const files=expandWildcard(rootdir+subfolder,pat);
            files.forEach(f=>{
                outfiles[(subfolder?subfolder+'/':'')+f]=true;
            })    
        })
    });
    const out=[];
    for (let fn in outfiles){
        if (fs.statSync(rootdir+fn).isDirectory()) {
            const files=fs.readdirSync(rootdir+fn).map(f=>fn+'/'+f);
            out.push(...files);
        } else {
            out.push(fn);
        }
    }
    return out;
}

export {nodefs};