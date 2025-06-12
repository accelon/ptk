import {readTextLines, writeChanged, readTextContent,fromIAST,toIASTOffText } from "../nodebundle.cjs";
export const toiast=(arg,arg2)=>{
	if (!arg) {
		console.log('missing filename');
		return;
	}
	const out=[];
	const lines=readTextLines(arg);
	for (let i=0;i<lines.length;i++){
		out.push(toIASTOffText(lines[i]));
	}
	writeChanged(arg+'-iast',out.join('\n'),true);
}

export const toppli=(arg,arg2)=>{
	if (!arg) {
		console.log('missing filename');
		return;
	}
	const lines=readTextLines(arg);
	console.log(lines.length)
}
