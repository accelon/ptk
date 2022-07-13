import {formatDOSDateTime, makeBuffer, clampInt16,clampInt32,makeUint8Array,crc32} from './utils.ts'
import {fileHeader,ZipConst,centralHeader,dataDescriptor} from './format.ts'

interface ZipInput {
	filename:string,
	content:Uint8Array,
}
export const makeZip=(inputs:ZipInput[])=>{
	let zipsize=0;
	for (let i=0;i<inputs.length;i++) {
		zipsize+=inputs[i].content.length + ZipConst.fileHeaderLength;
	}
	zipsize+=ZipConst.centralHeaderLength * inputs.length;
	const datenow=new Date();
	const zipbuf=new Uint8Array(zipsize*2);

	const centralRecords=[];
	let offset=0, centralSize=0;
	for (let i=0;i<inputs.length;i++) {
		const {name,date,content}=inputs[i];
		const encodedname=new TextEncoder().encode(name);
		let crc=crc32(content);
		const fileoffset=offset;
		const header=fileHeader(encodedname, content.length, date || datenow , crc);
		zipbuf.set(header , offset);
		offset+=header.length;
		zipbuf.set(encodedname,offset);
		offset+=encodedname.length;
		zipbuf.set(content, offset);
		offset+=content.length;

		// const desc=dataDescriptor(content.length,crc)
		// zipbuf.set(desc,offset);
		// offset+=desc.length;

		const rec=centralHeader(name, content.length, date|| datenow,crc, fileoffset );
		centralRecords.push(rec);
    	centralRecords.push(encodedname);
    	centralSize+=  rec.length+ encodedname.length ;//+ desc.length;
	}
	const centralOffset=offset;

    for (const record of centralRecords) {
        zipbuf.set(record,offset);
    	offset+=record.length; 
    }

	const end = makeBuffer(ZipConst.endLength)
	end.setUint32(0, ZipConst.endSignature)
	  // skip 4 useless bytes here
	end.setUint16(8, clampInt16(inputs.length), true)
	end.setUint16(10, clampInt16(inputs.length), true)
	end.setUint32(12, clampInt32(centralSize), true)
	end.setUint32(16, clampInt32(centralOffset), true)
	  // leave comment length = zero (2 bytes)
	 
	 console.log('centralSize',centralSize)
	const endarr=makeUint8Array(end);
	zipbuf.set(endarr,offset);
	offset+=endarr.length;

	return zipbuf.slice(0,offset);
}