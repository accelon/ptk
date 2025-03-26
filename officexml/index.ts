export * from './docx.ts'
export * from './docxfiles.ts'
export * from './para.ts'
export * from './rels.ts'
import offtextcontext from './offtext.ts'
import markdowncontext from './markdown.ts'
const contexts={offtextcontext,markdowncontext};
export const contextByFormat=(f:string)=>contexts[f+'context'];