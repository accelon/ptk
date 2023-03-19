import {makeBuffer, makeUint8Array,clampInt16,formatDOSDateTime,clampInt32} from './utils.ts';
export enum ZipConst {
	fileHeaderSignature = 0x504b_0304, //PK\0x03\0x04
	descriptorSignature = 0x504b_0708, //PK\0x07\0x08
	centralHeaderSignature = 0x504b_0102, //PK\0x01\0x02
	endSignature = 0x504b_0506, //PK\0x05\0x06
	fileHeaderLength = 30,
	centralHeaderLength = 46,
	endLength = 22,
	descriptorLength = 16
}
export function fileHeader(encodedname:Uint8Array, size:number , modDate:Date , crc :number) {
  const header = makeBuffer( ZipConst.fileHeaderLength)
  header.setUint32(0, ZipConst.fileHeaderSignature);
  header.setUint32(4, 0x0A_00_0008);  //enable utf8 https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 
  
//only support STORE mode
  formatDOSDateTime(modDate || new Date(), header, 10);
  header.setUint32(14,crc, true);
  header.setUint32(18,size, true);
  header.setUint32(22,size, true);
  header.setUint16(26, encodedname.length, true);
  return makeUint8Array(header);
}

export function centralHeader(encodedname:Uint8Array, size:number, modDate:Date, crc:number, offset: number) {
  const header = makeBuffer(ZipConst.centralHeaderLength)
  header.setUint32(0, ZipConst.centralHeaderSignature)
  
  header.setUint32(4, 0x14000a00);
  //enable utf8
  header.setUint16(8, 0x0008 ) ;//

  formatDOSDateTime(modDate, header, 12);
  header.setUint32(16, crc, true);
  header.setUint32(20, clampInt32(size), true);
  header.setUint32(24, clampInt32(size), true);
  header.setUint16(28, encodedname.length , true);
  header.setUint16(30, 0 , true);
  // useless disk fields = zero (4 bytes)
  // useless attributes = zero (4 bytes)
  header.setUint16(40, 0 ); //no permission
  header.setUint32(42, clampInt32(offset), true); // offset
  return makeUint8Array(header);
}
/*
export function dataDescriptor(size:number,crc:number) {
  const header = makeBuffer(ZipConst.descriptorLength );
  header.setUint32(0, ZipConst.descriptorSignature)
  header.setUint32(4, crc, true)
  header.setUint32(8, clampInt32(size), true)
  header.setUint32(12, clampInt32(size), true)
  return makeUint8Array(header)
}
*/