import {packIntDelta,packInt,unpackInt,unpackIntDelta,StringArray} from '../utils/index.ts';
export const serializeToc=(toc:Array<any>)=>{
	const out=Array<string>(),texts=Array<string>(),lines=Array<number>(),depths=Array<number>();
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
	//console.log(lines.length,depths.length,texts.length)
	return out;
}
export class TableOfContent {
	lines:Array<number>
	depths:Array<number>
	texts:StringArray
	constructor(section:string[]){
		this.lines=unpackIntDelta(section.shift());
		this.depths=unpackInt(section.shift());
		this.texts = new StringArray(section.shift());
	}
}
//chunk as toc
export const depthOfId=(str:string)=>{
	return str.split(/(\d+)/).filter(it=>!!it).length;
}
export function buildTocTag(toctags:Array<string>){
	for (let i=0;i<toctags.length;i++) {
		const toctag=toctags[i];
		const out=Array<number>();
		if (!this.defines[toctag]) {
			console.log('not such tag',toctag);
			continue;
		}
		const values=this.defines[toctag].fields.id.values;
		for (let j=0;j<values.length;j++) {
			out.push(depthOfId(values[j]));
		}
		this.defines[toctag].depths=out;
	}
}