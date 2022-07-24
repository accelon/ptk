import PTK from 'ptk/nodebundle.cjs'
const {inMemory} = PTK;
import {red,green} from '../cli/colors.cjs'
import {genNumberLines} from './mock-ptk.js'
let test=0,pass=0;
function createinmemory(){
	const lbaser=genNumberLines();
	const ptk=inMemory(lbaser);
	return ptk;
}
const ptk=createinmemory();
let lines=ptk.slice(1,3);
test++;pass+=lines.length==2;
test++;pass+=parseInt(lines[0])==1

lines=ptk.slice(ptk.lineCount()-1,ptk.lineCount());
test++;pass+=lines.length==1;
test++;pass+=parseInt(lines[0])==ptk.lineCount()-1



console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')