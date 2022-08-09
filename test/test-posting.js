import PTK from 'ptk/nodebundle.cjs'
const {openPtk,nodefs,postingLine} = PTK;
await nodefs;

const ptk=await openPtk('cyd');
 
await ptk.loadPosting('刳');
const lines=ptk.postingLine(ptk.getPostings('刳')[0]);
await ptk.loadLines(lines);
console.log( lines.map( line=>[line,ptk.getLine(line)]));
