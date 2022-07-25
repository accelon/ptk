import {inMemory,parseAddress,LVA} from '../nodebundle.cjs'
import {genNumberLines} from './mock-ptk.js'
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0, lva;
 
const lbaser=genNumberLines(10000);
lbaser.setName('mem');
const ptk=inMemory(lbaser);

const testLoad=async()=>{
	let address='mem::3<6';
	let lva=new LVA(address);
	let lines=await lva.load();
	test++;pass+=lines.length==3;
	
	//dig into 
	const newaddress=lva.dig('mem::10<11');
	lines=await lva.load();

	const lvanode=lva.getNode(lines[1].idx);
	test++;pass+=lvanode.from==10&&lvanode.till==11
	test++;pass+=!lines[3].lvanode;
 	
 	const undigged=lva.remove(1).stringify();
  	test++; pass+=undigged===address;

 	// already have adjecent child, add to same level
 	lva.dig('mem::10<11').dig('mem::20<21');
 	const addr2=lva.nodes();
  	
 	test++;pass+=addr2.length==4;
 	test++;pass+=addr2[1].from==20;
 	test++;pass+=addr2[2].from==10;
 	test++;pass+=addr2[1].depth&&addr2[2].depth;
}

await testLoad();

console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')
