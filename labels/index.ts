import z from "./z.ts"

const Labels={z};
import {extractTag} from '../offtext/parser.ts'

export const syntaxCheck=(editingbuffer:string)=>{
	const tags = extractTag(editingbuffer);
	const errors=[];
	for (let lbl in Labels) {
		Labels[lbl].init();
	}
	for (let i=0;i<tags.length;i++) {
		let {name}=tags[i];
		if (name[0]=='z') name='z';
		const lbl=Labels[name];
		if (lbl && lbl.check) lbl.check(tags[i],errors);
	}
	const out={errors};
	for (let lbl in Labels) {
		out[lbl]=Labels[lbl].finalize();
	}
	return out;
}