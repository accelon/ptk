//based on  https://github.com/Touffy/client-zip but only support sync mode
import {encodeString,makeBuffer, clampInt16,clampInt32,makeUint8Array,crc32} from './utils.ts'
import {fileHeader,ZipConst,centralHeader} from './format.ts'
interface ZipInput {
	name:string,
	content:Uint8Array,
	date:Date,
}
const MAX_FILENAME=256;
export const storeZip=(inputs:ZipInput[], opts={})=>{
	let estimatesize=0; 
	for (let i=0;i<inputs.length;i++) {
		let len=inputs[i].content.length;
		estimatesize+=len + ZipConst.fileHeaderLength + MAX_FILENAME; 
	}
	estimatesize+= (ZipConst.centralHeaderLength+MAX_FILENAME) * inputs.length + ZipConst.endLength;
	const datenow=new Date();
	let offset=opts.reserve||0, centralSize=0;
	const zipbuf=new Uint8Array(offset+estimatesize);

	const centralRecords=[];
	for (let i=0;i<inputs.length;i++) {
		const {name,date,content}=inputs[i];
		const contentarr=(typeof content=='string')?Buffer.from(content,'utf-8'):content;
		const encodedname=encodeString(name);
		let crc=crc32(contentarr);
		const fileoffset=offset;
		const header=fileHeader(encodedname, contentarr.length, date || datenow , crc);
		zipbuf.set(header, offset); 	offset+=header.length;
		zipbuf.set(encodedname,offset);	offset+=encodedname.length;
		zipbuf.set(contentarr, offset);	offset+=contentarr.length;
		const rec=centralHeader(encodedname, contentarr.length, date|| datenow,crc, fileoffset );
		centralRecords.push(rec);
    	centralRecords.push(encodedname);
    	centralSize+=rec.length+ encodedname.length ;
	}
	const centralOffset=offset;
    for (const record of centralRecords) {
        zipbuf.set(record,offset);
        offset+=record.length; 
    }
    //no comment
	const end = makeBuffer(ZipConst.endLength);
	end.setUint32(0, ZipConst.endSignature);
    // skip 4 useless bytes here
	end.setUint16(8,  clampInt16(inputs.length), true);
	end.setUint16(10, clampInt16(inputs.length), true);
	end.setUint32(12, clampInt32(centralSize),   true);
	end.setUint32(16, clampInt32(centralOffset), true);
	const endarr=makeUint8Array(end);
	zipbuf.set(endarr,offset);
	offset+=endarr.length;
	return zipbuf.subarray(0,offset); // avoid create new copy
}