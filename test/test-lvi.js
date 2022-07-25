import {inMemory,stringifyLVA,combineLVA,
	parseLVA,parseAddress,digLVA,undigLVA,loadLVI} from '../nodebundle.cjs'
import {genNumberLines} from './mock-ptk.js'
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0, lva;
 
const lbaser=genNumberLines(10000);
lbaser.setName('mem');
const ptk=inMemory(lbaser);

const testLoad=async()=>{
	let address='mem::3<6';
	let lines=await loadLVI(address);

	test++;pass+=lines.length==3;
	
	//dig into 
	const newaddress=digLVA(address,'mem::10<11')
	lines=await loadLVI(newaddress);
	let lva=parseLVA(lines[1].lva)[0];
	test++;pass+=lva.from==10&&lva.till==11
	test++;pass+=!lines[3].lva;
 	
	const lvas=lines.filter(it=>it.lva).map(it=>it.lva);
	//直接操作陣列，combineLVA 合併連續區段
	lvas.splice(1,1);
 	const undigged=combineLVA(lvas.join(' '));
 	test++; pass+=undigged===address;

 	// already have adjecent child, add to same level
 	const newaddress2=digLVA(newaddress,'mem::20<21');
 	const addr2=parseLVA(newaddress2);

 	test++;pass+=addr2.length==4;
 	test++;pass+=addr2[1].from==20;
 	test++;pass+=addr2[2].from==10;
 	test++;pass+=addr2[1].depth&&addr2[2].depth;

 	test++; pass+=undigged===address;
}

await testLoad();

console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
