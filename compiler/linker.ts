import {LineBaser} from '../linebase/index.ts';
import {Compiler,serializeBackTransclusion} from './compiler.ts';
import {Indexer} from '../fts/index.ts';
import {parseOfftext} from '../offtext/index.ts';
import {serializeToc} from './toc.ts';

const writeTypedefs=(lbaser:LineBaser, typedefs)=>{
	for (let tag in typedefs) {
		const typedef=typedefs[tag]
		const serialized=typedef.serialize();
		if (tag=='ak' && !typedef.linepos.length)  {
			console.log('missing ^ak');
		}
		if (serialized) {
			lbaser.append( serialized, {name:'^'+tag,newpage:true,samepage:true,type:'tag'});	
		}
	}
}
export const makeLineBaser=async (sourcebuffers,compiler:Compiler,contentGetter:any=null):Promise<LineBaser>=>{
	const lbaser=new LineBaser();
	if (compiler) compiler.reset();
	else compiler=new Compiler();
	
	const indexer=new Indexer();
	const alltagdefs=compiler.tagdefs.concat([]); //add built-in defines to 000.js payload

	for (let i=0;i<sourcebuffers.length;i++) {
		const buf=sourcebuffers[i];
		if (!buf) {
			console.log('empty')
			continue;
		}
		let text=buf.text||'';
		if (!text && contentGetter) {
			const content=await contentGetter(i);
			text=content.text||'';
		}

		if (buf.name.endsWith('.css')) continue; // todo , should check sourcetype
		compiler.compileBuffer(text,buf.name);
		
		if (!compiler.compiledFiles[buf.name]) {
			continue;
		}
		const {name,caption,errors,processed,samepage,
			lazy,tagdefs,textstart,sourcetype}=compiler.compiledFiles[buf.name];

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
	//write backlinks
	const backtransclusions=serializeBackTransclusion(compiler.backtransclusions);
	indexer.finalize();
	const [tokens,postings,wordcount]=indexer.serialize();
	lbaser.header.eot = lbaser._data.length;
	lbaser.header.preload.push('_tokens','_toc');
	lbaser.header.wordcount=wordcount;
	tokens.unshift('^:<type="tokens">');
	lbaser.append(tokens,{newpage:true,name:'_tokens'});
	lbaser.append(postings,{newpage:true,name:'_postings'});
	if (compiler.toc.length) lbaser.append(serializeToc(compiler.toc), {newpage:true,name:'_toc'});

	if (backtransclusions.length){
		lbaser.header.preload.push('_backtransclusions');
		lbaser.append(backtransclusions,{newpage:true,name:'_backtransclusions'});
	}
	

	lbaser.payload=alltagdefs.filter(it=>!!it).join('\n');

	if (!compiler.ptkname) {
		compiler.ptkname=new Date();
	 	return {err:"missing ptk name"};	
	 }
	writeTypedefs(lbaser,compiler.typedefs)

	lbaser.setName(compiler.ptkname);
	lbaser.newPage();//finalize
	return lbaser;
}