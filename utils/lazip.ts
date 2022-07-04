// Lazy Zip, read compressed file from zip only when needed.
// import JSZip from 'lazip' //need tailored version of jszip.
// a memory of zip file size is allocated
// only central directory of zip is fill up at the beginning.


function readInt(buf,idx,size) {
    var result = 0,  i;
    for (i = idx + size - 1; i >= idx; i--) {
       result = (result << 8) + buf[i];
    }
    return result;
}

const readBlob = async (file, zipbuf, fileoffset, end, bufferoffset)=>{
    const blob=file.slice(fileoffset,end);
    const buf=await blob.arrayBuffer();
    const arr=new Uint8Array(buf);
    if (typeof bufferoffset=='undefined') bufferoffset=fileoffset;
    zipbuf.set(arr,bufferoffset);
    return true;
}
const fetchBuf= async (url,zipbuf,fileoffset,end, bufferoffset)=>{ 
    if (url.name &&url.size) {
        return await readBlob(url,zipbuf,fileoffset,end, bufferoffset)
    }

    const res=await fetch(url,{headers: {
        'content-type': 'multipart/byteranges',
        'range': 'bytes='+fileoffset+'-'+end,
    }});

    if (typeof bufferoffset=='undefined') bufferoffset=fileoffset;
    if (res.ok) {
        const lastpart=new Uint8Array( await res.arrayBuffer());
        zipbuf.set(lastpart , bufferoffset);
        return true;
    }
    return false;
}

const fetchZIPEntries=async (url,zipbuf)=>{
    const i=zipbuf.length-22; //skip the localPart Header
    const dirSize=readInt(zipbuf,i+0xc,4)
    const dirOffset=readInt(zipbuf,i+0xc+4,4)
    return await fetchBuf(url,zipbuf,dirOffset,dirOffset+dirSize);
}
const debug=false;

const LaZip= async function(url,JSZip){
    if (!JSZip) throw "need to pass in JSZip constructor"

    const headbuf=new Uint8Array(16);
    const ok=await fetchBuf(url,headbuf, 0, 15);

    if (!ok) return null;
    let filesize;
    if (headbuf[0]!==0x50 || headbuf[1]!==0x4B) {
        console.error('invalid zip file',url);
        return false;
    }
    //see writePitakaZip below
    if (headbuf[7]&0x80) { //reserve bit 15 of flags
        //use TIME STAMP to store zip file size, normally local file headers are skipped.
        //workaround for chrome-extension HEAD not returning content-length
        filesize=readInt(headbuf,0xA,4);
    } else { //use HEAD
        let res=await fetch(url,{method:'HEAD'});
        filesize=parseInt(res.headers.get('Content-Length'));
    }    

    if (isNaN(filesize)) {
        debug&&console.error('unable to get filesize');
        return false;
    }
    debug&&console.timeEnd('head')

    debug&&console.time('allot memory')
    //to simplify loading central directory, allocate a buffer same size as zip file.
    //as cnetral directory is stored at the end.
    //GC may reclaim it after jszip does it work
    const zipbuf=new Uint8Array(filesize);
    let bufoffset=filesize-1024;
    if (bufoffset<0) bufoffset=0;   
    if (!await fetchBuf(url,zipbuf, bufoffset, filesize-1)) {
        debug&&console.log('cannot fetch central directory record')
        return;
    }
    debug&&console.timeEnd('allot memory')

    debug&&console.time('load entries')
    if (!await fetchZIPEntries(url,zipbuf)) {
        debug&&console.log('cannot fetch central entries')
        return;
    }
    debug&&console.timeEnd('load entries')

    debug&&console.time('loadAsync')
    const jszip=await JSZip.loadAsync(zipbuf,{lazyfetch:true});
    debug&&console.timeEnd('loadAsync')
    jszip.reader.data=null;//allow GC to free zipbuf
    jszip.reader.length=0;
    const fetchFile=async function(fn){
        const jsfile=this;
        const i=jszip.fileNames[fn]; //all filenames in zip
        if (i>-1) {
            const entry=jszip.fileEntries[i];
            const {localHeaderOffset,compressedSize}=entry;
            const sz=localHeaderOffset+compressedSize+1024; //assuming no per file comment
            
            //allocate a buffer just enough to hold the compressed content
            const filebuf=new Uint8Array(sz);
            await fetchBuf(url,filebuf, localHeaderOffset, sz, 0);

            jszip.reader.data=filebuf;   //set the reader, 
            jszip.reader.length=filebuf.length;

            jszip.reader.setIndex(4); //signature 4 bytes
            entry.readLocalPart(jszip.reader);
            entry.processAttributes();

            //create an entry in jszip.files , jszip.files stored fetched file
            //defering addFiles(results) in prepareContent
            jszip.file(entry.fileNameStr, entry.decompressed, {
                binary: true, optimizedBinaryString: true,
                date: entry.date,dir: entry.dir,
                comment: entry.fileCommentStr.length ? entry.fileCommentStr : null,
                unixPermissions: entry.unixPermissions,
                dosPermissions: entry.dosPermissions
            });
            jszip.reader.data=null;//allow GC to free filebuf
            jszip.reader.length=0;
            return jszip.files[fn];
        }
        return null;
    }
    const readTextFile=async function(fn) {
        let f=jszip.files[fn];
        if (!f) f=await fetchFile(fn);
        if (f) return await f.async("string");
    }
 
    const folders=[];
    for (let fn in jszip.fileNames) {
        if (fn.endsWith('/')) folders.push(fn.slice(0,fn.length-1));
    }
    return {readTextFile,fetchFile,jszip, folders};
}
export const makeZipFromJson=async(name ,JSZip)=>{
    const files=(await fs.promises.readdir(name)).filter(fn=>fn.match(/^\d+\.js$/));
    files.sort((a,b)=>parseInt(a)-parseInt(b))
    const zip=new JSZip();
    for (let i=0;i<files.length;i++) {
        const buf=await fs.promises.readFile(name+'/'+files[i]);
        await zip.file( name+'/'+files[i], buf , {compression:'DEFLATE'});
    }
    const buffer=await makePitakaZip(zip);
    await fs.promises.writeFile(name+'.ptk', buffer);
    return {fn:name+'.ptk',size:buffer.length};
}
export const makePitakaZip=async(zip:JSZip, writer)=>{
    const buf=await zip.generateAsync({type:'arraybuffer'});
    const arr=new Uint8Array(buf);
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
// LaZip.JSZip=JSZip;
// LaZip.loadAsync=JSZip.loadAsync;
export {LaZip};
export default LaZip;