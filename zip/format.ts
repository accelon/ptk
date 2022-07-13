import {makeBuffer, makeUint8Array,clampInt16,formatDOSDateTime,clampInt32} from './utils.ts';
export enum ZipConst {
	fileHeaderSignature = 0x504b_0304,
	descriptorSignature = 0x504b_0708,
	centralHeaderSignature = 0x504b_0102,
	endSignature = 0x504b_0506,
	fileHeaderLength = 30,
	centralHeaderLength = 46,
	endLength = 22,
	descriptorLength = 16
}


export function fileHeader(encodedname:Uint8Array, size:number , modDate:Date , crc :number) {
  const header = makeBuffer( ZipConst.fileHeaderLength)
  header.setUint32(0, ZipConst.fileHeaderSignature)
  header.setUint32(4, 0x0A_00_0000) 
  // leave compression = zero (2 bytes) until we implement compression
  formatDOSDateTime(modDate || new Date(), header, 10)
  
  header.setUint32(14,crc, true);
  header.setUint32(18,size, true);
  header.setUint32(22,size, true);
  // leave CRC = zero (4 bytes) because we'll write it later, in the central repo
  // leave lengths = zero (2x4 bytes) because we'll write them later, in the central repo


  header.setUint16(26, encodedname.length, true)
  // leave extra field length = zero (2 bytes)
  return makeUint8Array(header);
}

export function centralHeader(encodedname:Uint8Array, size:number, modDate:Date, crc:number, offset: number) {
  const header = makeBuffer(ZipConst.centralHeaderLength)
  header.setUint32(0, ZipConst.centralHeaderSignature)
  // header.setUint32(4, 0x2d03_2d_00) // UNIX app version 4.5 | ZIP version 4.5
  // header.setUint32(4, 0x0a00_14_00) // UNIX app version 4.5 | ZIP version 4.5
  header.setUint32(4, 0x14000a00) // UNIX app version 4.5 | ZIP version 4.5
  
  // header.setUint16(8, 0x0800) // flags, bit 3 on
  // leave compression = zero (2 bytes) until we implement compression

  formatDOSDateTime(modDate, header, 12)
  header.setUint32(16, crc, true)
  header.setUint32(20, clampInt32(size), true)
  header.setUint32(24, clampInt32(size), true)
  header.setUint16(28, encodedname.length , true)
  header.setUint16(30, 0 , true)
  // useless disk fields = zero (4 bytes)
  // useless attributes = zero (4 bytes)
  //header.setUint16(40, 0o100664, true) // UNIX regular file, permissions 664
  header.setUint16(40, 0x31)
  header.setUint32(42, clampInt32(offset), true) // offset

  return makeUint8Array(header)
}


export function dataDescriptor(size:number,crc:number) {
  const header = makeBuffer(ZipConst.descriptorLength );
  header.setUint32(0, ZipConst.descriptorSignature)
  header.setUint32(4, crc, true)
  header.setUint32(8, clampInt32(size), true)
  header.setUint32(12, clampInt32(size), true)
  return makeUint8Array(header)
}
