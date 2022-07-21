export * from './pool.ts'
export * from './openptk.ts'
export * from './address.ts'
export const regPtkName =  /^[a-z]{2,16}$/
export const validPtkName=(name:string):boolean=>!!name.match(regPtkName);
