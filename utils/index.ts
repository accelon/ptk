export * from './array.ts'
export * from './sortedarray.ts'
export * from './packintarray.ts'
export * from './unpackintarray.ts'
export * from './packstr.ts'
export * from './unpackstr.ts'
export * from './unicode.ts'
export * from './bsearch.ts'
export * from './stringarray.ts'
export * from './cjk.ts'
export * from './lazip.ts'
export * from './errata.ts'
export const escapeTemplateString=str=>str.replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/\$\{/g,'$\\{');
export function pagejsonpfn(nchunk,folder){
    const jsfn=nchunk.toString().padStart(3,'0')+'.js'
    return folder?folder+'/'+jsfn:jsfn;
}
