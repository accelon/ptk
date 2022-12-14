import * as PTK from '../nodebundle.cjs';
const {writeChanged,StringArray,readTextContent,readTextLines } = PTK;
import * as colors from './colors.cjs'; 
const {red,bold,green,cyan} = colors;

export const onelexicon=(taskname,cb)=>{
	const fn=process.argv[3];
	if (!fn) {
		console.log(red('missing filename'))
		return;
	}
	const now=new Date();
	const text=readTextLines(fn,'utf8');
	console.log(cyan(fn),text.length,'lines');
	const out=cb(text,fn);
	const outfn=fn+'-'+taskname;
	if (writeChanged(fn+'-'+taskname,out.join('\n'),'utf8')) {
		console.log(bold(cyan(outfn)),'written',out.length,'lines');	
	} else {
		console.log(bold(cyan(outfn)),'untouched',out.length,'lines');
	}
	console.log(bold(taskname),'completed', new Date()-now , 'ms');
}
export const lexicons=(taskname,cb)=>{
	let i=3;
	const now=new Date();
	const contents=[],filenames=[];
	let fn=process.argv[i];
	while (fn) {
		if (!fs.existsSync(fn)) {console.log(red('not exists'),green(fn));return;}
		let lexicon=readTextLines(fn);
		if (fn.endsWith('.csv'))  {
			lexicon=lexicon.map(it=> it.slice(0, it.indexOf(',')));
		} if (fn.endsWith('.tsv'))  {
			lexicon=lexicon.map(it=> it.slice(0, it.indexOf('\t')));
		}
		contents.push(lexicon);
		filenames.push(fn);
		fn=process.argv[++i];
	}
	contents.forEach((it,idx)=>{
		console.log( cyan(filenames[idx]), it.length, 'lines')
	})
	let outfn=filenames.join('-')+'-'+taskname;
	
	const out=cb(contents);
	const written=(writeChanged(outfn,out.join('\n'),'utf8'))?'written':'untouched';
	console.log(bold(cyan(outfn)),written,out.length,'lines');	

	console.log(bold(taskname),'completed', new Date()-now , 'ms');
}
export const text_lexicon=(taskname,cb)=>{
	const fn=process.argv[3];
	if (!fn) {console.log(red('missing filename'));return;}
	let lexiconfn=process.argv[4];
	if (!lexiconfn) lexiconfn='hydcd3.txt';
	if (!fs.existsSync(lexiconfn)){console.log(red('missing lexicon'),green(lexiconfn));return;}
	const now=new Date();
	const text=new StringArray(readTextContent(fn));
	const lexicon=new StringArray(readTextContent(lexiconfn));
	console.log(cyan(fn),text.len(),'lines,' ,cyan(lexiconfn), lexicon.len(),'entries');
	const out=cb(text, lexicon);
	const outfn=fn+'-'+taskname+'.csv';
	process.stdout.write('\r\n')
	const written=(writeChanged(outfn,out.join('\n'),'utf8'))?'written':'untouched';
	console.log(bold(cyan(outfn)),written,out.length,'lines');	

	console.log(bold(taskname),'completed',  new Date()-now , 'ms');
}


export default {onelexicon,text_lexicon}