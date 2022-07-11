import {parseOfftextLine} from '../offtext/parser.ts'
import {Column} from '../linebase/column.ts'
export function processOfftextLines(lines:string[],filename:string){
	if (!lines.length) return;
	const {lbase,primarykeys}=this;
	const [text,tags]=parseOfftextLine(lines[0]);
	if (tags[0].name=='_') { //define a section
		const attrs=tags[0].attrs;
		if (attrs.ptk) {
			if (lbase.name) {
				throw "already named "+lbase.name;
			} else {
				lbase.name=attrs.ptk;
				lbase.header.zh=attrs.zh;
			}
		}
		if (attrs.type=='tsv') {
			const columns=new Column(attrs, text.split('\t') , primarykeys);
			const header=lines.shift();
			const serialized=columns.fromTSV(lines);
			const name = attrs.name || filename;  //use filename if name is not specified
			serialized.unshift(header);
			//primary key can be refered by other tsv
			if (attrs.name) primarykeys[attrs.name]= columns.keys;
			lbase.append(serialized, {name,type:'tsv',newpage:true, samepage:true});
			return null;
		}
		 if (attrs.type=='lexicon') {
		 	throw "obsulte format lexicon"
		 }
	}

	return lines;

}