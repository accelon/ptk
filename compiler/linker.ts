import {LineBaser} from '../linebase/index.ts';
import {ICompiler} from './compiler.ts';
import {Indexer} from '../fts/index.ts';
import {parseOfftext} from '../offtext/index.ts';
import {serializeToc} from './toc.ts';

export const makeLineBaser=async (sourcebuffers,compiler:ICompiler,contentGetter)=>{
	lbaser=new LineBaser();
	if (compiler) compiler.reset();
	else compiler=new Compiler();
	const indexer=new Indexer();
	const alltagdefs=compiler.tagdefs.concat([]); //add built-in defines to 000.js payload

	for (let i=0;i<sourcebuffers.length;i++) {
		const buf=sourcebuffers[i];
		const {text}=await contentGetter(i);
		const ext=buf.name.match(/(.[a-z]+)/)[1]||'';
		if (buf.name.endsWith('.css')) continue; // todo , should check sourcetype
		compiler.compileBuffer(text,buf.name);
		const {name,caption,errors,processed,samepage,lazy,tagdefs,textstart,sourcetype}=compiler.compiledFiles[buf.name];
		alltagdefs.push(...tagdefs);
		if (!lazy) lbaser.header.preload.push(name);
		lbaser.append(processed,{name:name.replace('*',''),samepage,sourcetype});
		if (errors.length) {
			console.table(errors);
			errors.length=0;
		}
		let unindexablelines=textstart;
		while (unindexablelines>0) {
			indexer.addLine('');
			unindexablelines--;
		}
		if (textstart<processed.length) {
			lbaser.header.fulltext.push(name);
			lbaser.header.fulltextcaption.push(caption||name);
			const toindex=(textstart?processed.slice(textstart):processed);
			for (let j=0;j<toindex.length;j++) {
				const [text]=parseOfftext(toindex[j]);
				indexer.addLine(text);
			}
		}
	}
	indexer.finalize();
	const [tokens,postings]=indexer.serialize();
	lbaser.header.eot = lbaser._data.length;
	lbaser.header.preload.push('_tokens','_toc');
	tokens.unshift('^:<type="tokens">');
	lbaser.append(tokens,{newpage:true,name:'_tokens'});
	lbaser.append(postings,{newpage:true,name:'_postings'});
	if (compiler.toc.length) lbaser.append(serializeToc(compiler.toc), {newpage:true,name:'_toc'});

	lbaser.payload=alltagdefs.filter(it=>!!it).join('\n');
	if (!compiler.ptkname) {
		return "missing ptk name";	
	}

	for (let tag in compiler.typedefs) {
		const serialized=compiler.typedefs[tag].serialize();
		const name='^'+tag;
		serialized && lbaser.append( serialized, {name,newpage:true,samepage:true,type:'tag'});
	}

	lbaser.setName(compiler.ptkname);
	return lbaser;
}