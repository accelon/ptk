// @ts-ignore
import {StringArray} from './nodebundle.cjs';
let test=0,pass=0;
console.time('load');
import bigfile from './bigfile.mjs'
console.timeEnd('load');
console.log('bigfile length',bigfile.length);

//console.time('split');
//const lines=bigfile.split(/\r?\n/);
//console.timeEnd('split');

console.time('stringarray');
const sa=new StringArray(bigfile,{delimiter:'='});
console.timeEnd('stringarray'); 
//console.log(sa.len());

let tofind,at;

//return the length
pass += ( parseInt(sa.get(0)) == sa.len() ) ?1:0; test++; 

// console.log(sa.get(100));


//1~99999
tofind='     1'
at=sa.find(tofind);
pass += sa.get(at).startsWith(tofind) ? 1:0; test++;

// console.log(sa.get(at),at)

tofind='     2'
at=sa.find(tofind);
pass += sa.get(at).startsWith(tofind) ? 1:0; test++;

tofind=' 99998'
at=sa.find(tofind);
pass += sa.get(at).startsWith(tofind) ? 1:0; test++;

tofind=' 99999'
at=sa.find(tofind);
pass += sa.get(at).startsWith(tofind) ? 1:0; test++;

for (let i=0;i<10;i++) {
	tofind='      '+(Math.floor(Math.random()*100000)).toString();
	tofind=tofind.slice(tofind.length-6);
	at=sa.find(tofind);
	pass += sa.get(at).startsWith(tofind) ? 1:0; test++;	
}

tofind='100000'; //beyond
at=sa.find(tofind);
pass += !sa.get(at).startsWith(tofind) ? 1:0; test++;


console.log('test',test,'pass',pass);