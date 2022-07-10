import {parseOfftextLine} from '../offtext/parser.ts'
import {Column} from '../linebase/column.ts'
export function processOfftextLines(lines:string[],sectionname:string){
	if (!lines.length) return;
	const lbase=this;
	const [text,tags]=parseOfftextLine(lines[0]);
	if (tags[0].name=='_') {
		const attrs=tags[0].attrs;
		if (attrs.name) {
			if (lbase.name) {
				throw "already named "+lbase.name;
			} else {
				lbase.name=attrs.name;
				lbase.header.zh=attrs.zh;
			}
		}
		if (attrs.format=='lexicon') {
			const columns=new Column(attrs);
			const header=lines.shift();
			const out=columns.fromLexicon(lines);
			out.unshift(header);
			lbase.append(out, {name:sectionname,type:'lexicon',newpage:true, nobreak:true})
			return null;
		}
	}

	return lines;

}