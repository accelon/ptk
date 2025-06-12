import {readTextLines, writeChanged, readTextContent,fromIASTOffText,toIASTOffText } from "../nodebundle.cjs";
export const toiast=(arg,arg2)=>{
	if (!arg) {
		console.log('missing filename');
		return;
	}
	const out=[];
	const lines=readTextLines(arg);
	for (let i=0;i<lines.length;i++){
		if (lines[i].charAt(0)=='{') {//skip json
			out.push(lines[i])
			continue;
		}
		out.push(toIASTOffText(lines[i]));
	}
	writeChanged(arg+'-iast',out.join('\n'),true);
}

export const toppli=(arg,arg2)=>{
	if (!arg) {
		console.log('missing filename');
		return;
	}
	const out=[];
	const lines=readTextLines(arg);
	for (let i=0;i<lines.length;i++){
		if (lines[i].charAt(0)=='{') {//skip json
			out.push(lines[i])
			continue;
		}
		out.push(fromIASTOffText(lines[i]));
	}
	writeChanged(arg+'-ppli',out.join('\n'),true);
}
