import {ZipStore} from './zipstore.ts';
const readBlob = async (file, zipbuf, fileoffset, end, bufferoffset)=>{
    const blob=file.slice(fileoffset,end);
    const buf=await blob.arrayBuffer();
    const arr=new Uint8Array(buf);
    if (typeof bufferoffset=='undefined') bufferoffset=fileoffset;
    zipbuf.set(arr,bufferoffset);
    return true;
}
const fetchBuf= async (url,zipbuf,fileoffset,end, bufferoffset)=>{ 
    if (url.name &&url.size) { //a user provide file handle
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
export class RemoteZipStore {
	constructor () {
		this.zipstore=null;
		this.url='';
		this.filenames={};  //access via name
		this.files;         //from zipstore, access via array index
	}
	content(name_idx: number|string){
		let fileinfo=(typeof name_idx=='string')?this.filenames[name_idx]:this.files[name_idx];
		if (!fileinfo) return null;
		return fileinfo.content;
	}
	async load(files:string[]|string,binary=false) {
		if (typeof files=='string') files=[files];
		const jobs=[];
		for (let i=0;i<files.length;i++) {
			jobs.push( this.fetchFile(files[i],binary));
		}
		return Promise.all(jobs);
	}
	async fetchFile(name_idx: number|string, binary=false) {
		let fileinfo=(typeof name_idx=='string')?this.filenames[name_idx]:this.files[name_idx];
		if (!fileinfo) return null;

		if (typeof fileinfo.content!=='undefined') {
			if (!binary && typeof fileinfo.content!=='string') {
				fileinfo.content=new TextDecoder().decode(fileinfo.content);
			}
			return fileinfo.content;
		} else {
			const {offset,size}=fileinfo;
			const buf=new Uint8Array(size);
			const ok=await fetchBuf(this.url,buf, offset, offset+size-1, 0);
			if (ok) {
				fileinfo.content=binary?buf: new TextDecoder().decode(buf);
				return fileinfo.content;
			}
		}
	}
	async open(url, opts={}){  //read central directory
		this.url=url;
	    const headbuf=new Uint8Array(16);
	    const dv=new DataView(headbuf.buffer);
	    const ok=await fetchBuf(url,headbuf, 0, 15);
	    const full=opts.full;  //read entire zip at once
	    if (!ok) return null;
	    let filesize;
	    if ((headbuf[0]!==0x50 || headbuf[1]!==0x4B)       //normal zip
	    	&& (headbuf[0]!==0x4D || headbuf[1]!==0x5A)) { //MZ redbean
	        return false;
	    }
	    if (headbuf[0]==0x50 && headbuf[7]&0x80) { //reserve bit 15 of flags
	        //use TIME STAMP to store zip file size, normally local file headers are skipped.
	        //workaround for chrome-extension HEAD not returning content-length
	        filesize=dv.getUint32(0xA,true);
	    } else {
	        let res=await fetch(url,{method:'HEAD'});
	        filesize=parseInt(res.headers.get('Content-Length'));
	    }
	    if (isNaN(filesize)) return false;

	    let bufsize=full?filesize:1024*1024;    // assuming central fits in 1MB
	    if (bufsize>filesize) bufsize=filesize; // zip file smaller than 1MB
	    const zipbuf=new Uint8Array(bufsize);

	    //fetch the central and end part of zip
	    if (!await fetchBuf(url,zipbuf , filesize-bufsize, filesize-1,0)) {
	        return;
	    }
	    this.zipstore=new ZipStore(zipbuf);
	    this.files=this.zipstore.files;
	    for (let i=0;i<this.files.length;i++) {
	    	this.filenames[ this.files[i].name ] = this.files[i];
	    }
	    return true;
	}
}