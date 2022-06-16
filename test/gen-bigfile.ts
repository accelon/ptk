import {pack} from '../utils/packintarray.ts';
console.log('generating random text');
const out:string[]=[], len:number[]=[];
for (let i=1;i<100000;i++) {
   const size=Math.floor(Math.random()*50)+5;
   const s= i.toString().padStart(6,' ')+'-'+((Math.random()*1000000).toString(36).replace('.','').repeat(10)).slice(0,size)+'|';
   out.push(s);
   len.push(s.length+1);
}
console.log('writing bigfile.mjs');
Deno.writeTextFile( 'bigfile.mjs', 'export default `'+out.join('\n')+'`');
console.log(len.slice(0,10));
out.unshift(  pack(len) );
console.log('writing bigfile_index.mjs');
Deno.writeTextFile( 'bigfile_indexed.mjs', 'export default `'+out.join('\n')+'`');