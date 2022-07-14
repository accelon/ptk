import PTK from 'ptk/nodebundle.cjs'
const {nodefs,storeZip,ZipStore} = PTK;
await nodefs;      
let test=0,pass=0;

const files=[
	{name:'f1',  content:new TextEncoder().encode('一中文1234567890abcdef') },
	{name:'f2',  content:new TextEncoder().encode('fedcba0987654321') } ,
] 
const reserve=4;
const buf=storeZip(files, {reserve}); 

fs.writeFileSync('test.zip',buf);

const rbuf=fs.readFileSync("test.zip");
const zipstore= new ZipStore(new Uint8Array(rbuf));

for (let i=0;i<files.length;i++) {
	pass+=(zipstore.files[i].name==files[i].name)?1:0;test++;
	pass+=(zipstore.files[i].content.toString()==files[i].content.toString())?1:0;test++;
}

console.log('pass',pass,'test',test)