import PTK from 'ptk/nodebundle.cjs'
const {openPtk,nodefs,postingLine} = PTK;
await nodefs;

const ptk=await openPtk('cyd');
 
const res=await ptk.parseQuery('臘梅');
console.log(res)
// const lines=ptk.postingLine(ptk.getPostings('臘')[0]);
// await ptk.loadLines(lines);
// console.log( lines.map( line=>[line,ptk.getLine(line)]));
