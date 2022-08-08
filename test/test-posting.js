import PTK from 'ptk/nodebundle.cjs'
const {openPtk,nodefs} = PTK;
await nodefs;

const ptk=await openPtk('cyd');
 
await ptk.loadPosting('忝');
console.log(ptk.getPostings('忝'))
