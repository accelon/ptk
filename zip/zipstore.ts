/*
   No Async, No comment, no disk/network io, no compression, no crc checking, 32bits only.
   No Checking of local file header
   allow lazy loading of file content.
   Silent if not a zip
*/
import {ZipConst} from './format.ts'
export interface IZipFile {
	name:string,
	offset:number,       //offset of actual store content, zip file header is skip
	size:number,         //size of content
	content:Uint8Array,  //decode to utf8 if content is included in zipbuf
}
interface IZipStore {
	files:IZipFile[],
}
export class ZipStore {
	//zipbuf should at least include the Central records.
	constructor (zipbuf:Uint8Array) { 
		//may pass in nodejs readFile result
		if (zipbuf instanceof ArrayBuffer) {
			zipbuf=new Uint8Array(zipbuf);
		}
		this.zipbuf=(zipbuf instanceof Uint8Array)?zipbuf:new Uint8Array(zipbuf.buffer);
		this.files=[];
		this.zipStart=0;  //begining first file including header (PK)
		const {fileCount,centralSize,centralOffset}=this.loadEndRecord();

		if (!fileCount) return null;
		this.loadFiles(fileCount,centralSize,centralOffset);
	}
	private loadFiles(fileCount,centralSize,centralOffset){
		//calculate centraloffset from end of buffer , 
		//an partial zip buf is smaller than value specified in endRecord
		const coffset=this.zipbuf.length-ZipConst.endLength-centralSize;

		// const centralbuf=new DataView(this.zipbuf.slice(coffset,coffset+centralSize).buffer);
		const buf=new DataView(this.zipbuf.buffer);
		let p=coffset;

		for (let i=0;i<fileCount;i++) {
			const signature=buf.getUint32(p);
			if (signature!==ZipConst.centralHeaderSignature) {
				//throw "wrong central header signature"
				break;
			}
			const size   =buf.getUint32(p+20,true);
			const namelen=buf.getUint16(p+28,true);
			const extra=buf.getUint16(p+30,true);
			const commentlen=buf.getUint16(p+32,true);
			
			let   offset =buf.getUint32(p+42,true);

			p+= ZipConst.centralHeaderLength;
			const encodedName=this.zipbuf.subarray(p,p+namelen)
			
			const name=new TextDecoder().decode(encodedName);
			p+= namelen ;
			p+= extra + commentlen;

			if (i===0) this.zipStart=offset; //before zipstart is RedBean 
			offset+=ZipConst.fileHeaderLength+namelen; //skip the local file header
			let content;

			const inbuf=centralOffset-coffset;
			if (offset - inbuf>=0) {
				content= this.zipbuf.subarray(offset-inbuf,offset-inbuf+size);
			} // else host will do lazy loading
			this.files.push({name,offset,size,content});       //offset and size of actual data in the zip image
		}
	}
	private loadEndRecord(){
		const endRecord={signature:0,fileCount:0, centralSize:0, centralOffset:0};
		//cannot use subarray here
		const buf=new DataView(this.zipbuf.buffer);//this.zipbuf.slice(this.zipbuf.length-ZipConst.endLength).buffer);
		// console.log(endbuf)
		const endpos=this.zipbuf.length-ZipConst.endLength;
		endRecord.signature=buf.getUint32(endpos);
		if (endRecord.signature!==ZipConst.endSignature) {
			console.log('endrecord signature',endRecord.signature,'zipbuf length',this.zipbuf.length);
			throw "wrong endRecord signature"
			return endRecord;
		}

		endRecord.fileCount=buf.getUint16(endpos+8,true);
		endRecord.centralSize=buf.getUint32(endpos+12,true);
		endRecord.centralOffset=buf.getUint32(endpos+16,true);
		return endRecord;
	}
}