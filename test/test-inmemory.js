import PTK from 'ptk/nodebundle.cjs'
const {inMemory, LineBaser,Column,writeChanged,makePitakaZip} = PTK;
import {red,green} from '../cli/colors.cjs'
let test=0,pass=0;
const MAXLINE=10000;
const genLineBase=()=>{
	const lbase=new LineBaser();
	const out=[];
	for (let i=0;i<MAXLINE;i++) {
		const s= i.toString().padStart(6,' ')+'='+((Math.random()*1000000).toString(36).padStart(8,'0')
	    .replace('.','').repeat(10));
	    out.push(s);
	    if (i % 1024 == 0 ) {
	    	lbase.append(out);
	    	out.length=0;
	    }
	}
	lbase.append(out);
    return lbase;
}
function createinmemory(){
	const lbaser=genLineBase();
	lbaser.setName('inmemory');
	const ptk=inMemory(lbaser);
	return ptk;
}
const ptk=createinmemory();
let lines=ptk.slice(1,3);
test++;pass+=lines.length==2;
test++;pass+=parseInt(lines[0])==1

lines=ptk.slice(MAXLINE-1,MAXLINE);
test++;pass+=lines.length==1;
test++;pass+=parseInt(lines[0])==MAXLINE-1



console.log('pass',test==pass?green(pass):pass, (test-pass)?('failed',red(test-pass)):'')