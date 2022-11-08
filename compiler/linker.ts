import {LineBaser} from '../linebase/index.ts';
import {ICompiler} from './compiler.ts';
import {Indexer} from '../fts/index.ts';
import {parseOfftext} from '../offtext/index.ts';
import {serializeToc} from './toc.ts';

export const makeLineBaser=async (sourcebuffers,compiler:ICompiler,contentGetter)=>{
	lbaser=new LineBaser();
	const alldefines=[];
	if (compiler) compiler.reset();
	else compiler=new Compiler();
	const indexer=new Indexer();

	for (let i=0;i<sourcebuffers.length;i++) {
		const buf=sourcebuffers[i];

		const {text}=await contentGetter(i);

		const ext=buf.name.match(/(.[a-z]+)/)[1]||'';
		if (buf.name.endsWith('.css')) continue; // todo , should check sourcetype
		compiler.compileBuffer(text,buf.name);
		const {name,caption,errors,sourcetype,processed,samepage,preload,defines,textstart}=compiler.compiledFiles[buf.name];
		alldefines.push(...defines);
		if (preload) lbaser.header.preload.push(name);
		lbaser.append(processed,{name:name.replace('*',''),samepage});
		if (errors.length) console.log(errors);
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
	tokens.unshift('^_<type="tokens">');
	lbaser.append(tokens,{newpage:true,name:'_tokens'});
	lbaser.append(postings,{newpage:true,name:'_postings'});
	if (compiler.toc.length) lbaser.append(serializeToc(compiler.toc), {newpage:true,name:'_toc'});

	lbaser.payload=alldefines.join('\n');
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