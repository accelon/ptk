export const makeBuffer = (size: number) => new DataView(new ArrayBuffer(size))
export const makeUint8Array = (thing: any) => new Uint8Array(thing.buffer || thing)
export const encodeString = (whatever: unknown) => new TextEncoder().encode(String(whatever))
export const clampInt32 = (n: bigint) => Math.min(0xffffffff, Number(n))
export const clampInt16 = (n: bigint) => Math.min(0xffff, Number(n))
export function formatDOSDateTime(date: Date, into: DataView, offset = 0) {
  const dosTime = date.getSeconds() >> 1
  | date.getMinutes() << 5
  | date.getHours() << 11

  const dosDate = date.getDate()
  | (date.getMonth() + 1) << 5
  | (date.getFullYear() - 1980) << 9

  into.setUint16(offset, dosTime, true)
  into.setUint16(offset + 2, dosDate, true)
}

const wasm = "AGFzbQEAAAABCgJgAABgAn9/AXwDAwIAAQUDAQACBwkCAW0CAAFjAAEIAQAKlQECSQEDfwNAIAEhAEEAIQIDQCAAQQF2IABBAXFBoIbi7X5scyEAIAJBAWoiAkEIRw0ACyABQQJ0IAA2AgAgAUEBaiIBQYACRw0ACwtJAQF/IAFBf3MhAUGAgAQhAkGAgAQgAGohAANAIAFB/wFxIAItAABzQQJ0KAIAIAFBCHZzIQEgAkEBaiICIABJDQALIAFBf3O4Cw"
const instance = new WebAssembly.Instance(
  new WebAssembly.Module(Uint8Array.from(atob(wasm), c => c.charCodeAt(0)))
)
const { c, m } = instance.exports as { c(length: number, init: number): number, m: WebAssembly.Memory }

// Someday we'll have BYOB stream readers and encodeInto etc.
// When that happens, we should write into this buffer directly.
const pageSize = 0x10000 // 64 kB
const crcBuffer = makeUint8Array(m).subarray(pageSize)

export function crc32(data: Uint8Array, crc = 0) {
  while (data.length > pageSize) {
    crcBuffer.set(data.subarray(0, pageSize))
    crc= c(pageSize,crc)
    data = data.subarray(pageSize);
  }
  if (data.length) {
    crcBuffer.set(data)
    crc= c(data.length,crc)
  }
  return crc
}