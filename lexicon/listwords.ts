import {incObj,fromObj} from '../utils/index.ts'

export const listwords=(text:StringArray, lexicon:StringArray)=>{
	let line=text.first() , linecount=0;
	const patterns={};
	while (line || line=='') {
		let i=0;
		while (i<line.length) {
			const cp=line.charCodeAt(i);
			if (cp>=0xdc800 && cp<=0xdfff) i++;
			const matches=lexicon.match(line.slice(i)).filter(it=>it.length>1);
			if (matches.length) {
				matches.forEach(m=>incObj(patterns,m) )
				// console.log( matches )
			}
			i++;
		}
		line=text.next();
		linecount++
		if (linecount>10000) break;
		if (linecount%1024==0) process.stdout.write('\r'+linecount+'/'+text.len()+'   ');
	}

	const arr=fromObj(patterns,true);
	return arr;
}