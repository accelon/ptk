import {packIntDelta,packInt,unpackInt,unpackIntDelta,StringArray} from '../utils/index.ts';
export const serializeToc=toc=>{
	const out=[],texts=[],lines=[],depths=[];
	for (let i=0;i<toc.length;i++) {
		const {depth,line,text} = toc[i];
		depths.push(depth);
		lines.push(line);
		texts.push(text.replace(/\t/g,' '));
	}
	out.push('^:<type=toc>'); // section name is _toc
	out.push(packIntDelta(lines));
	out.push(packInt(depths));
	out.push(texts.join('\t'));
	console.log(lines.length,depths.length,texts.length)
	return out;
}
export class TableOfContent {
	constructor(section:string[],name:string){
		this.lines=unpackIntDelta(section.shift());
		this.depths=unpackInt(section.shift());
		this.texts = new StringArray(section.shift());
	}
}