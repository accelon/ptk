import {inMemory,stringifyLVA,parseLVA,digLVA,undigLVA,loadLVA} from '../nodebundle.cjs'
import {genNumberLines} from './mock-ptk.js'
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0, lva;

const lbaser=genNumberLines(10000);
lbaser.setName('mem');
const ptk=inMemory(lbaser);

const testLoad=async()=>{
	let address='mem:<3>6';

	let lines=await loadLVA(address);
	test++;pass+=lines.length==4;
	
	//dig into 
	const newaddress=digLVA(address,'mem:<10>11')
	lines=await loadLVA(newaddress);
	console.log(lines)
	// test++;pass+=lines[1].lva.left==10&&lines[1].lva.right==10
	// test++;pass+=!lines[3].lva;
 	
	// const lvas=lines.filter(it=>it.lva).map(it=>it.lva);
	// // lvas.splice(1,1);
 // // 	const undigged=stringifyLVA(lvas);
 // // 	test++; pass+=undigged===address;


 	//already have adjecent child, add to same level
 	// const newaddress2=digLVA(newaddress,'mem:<20>20');
 	// const addr2=parseLVA(newaddress2);

 	// test++;pass+=addr2.length==4;
 	// test++;pass+=addr2[1].left==20;
 	// test++;pass+=addr2[2].left==10;
 	// test++;pass+=addr2[1].depth&&addr2[2].depth;

 	// test++; pass+=undigged===address;
}

await testLoad();

console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
