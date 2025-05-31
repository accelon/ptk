import PTK from '../nodebundle.cjs';
const {LineBaser,Compiler,writeChanged,humanBytes,makeInMemoryPtk} = PTK;
//import kluer from './kluer.js'
import * as colors from './colors.js';
import Path from 'path';
const {cyan,red} =colors;

const filelist=files=>files.length>10?[files.length,files.slice(0,10)]:[files.length,files];

export const dobuild=async (files, opts={})=>{
	const jsonp=opts.jsonp;
	const com=opts.com;
	const [filecount, list]=filelist(files);
	const sources=[];
	console.log('input', filecount,'files', list,((filecount>list.length)?'...':'')  );
	const outdir=opts.outdir||'';
	const indir=opts.indir||'';
	let lbaser;
	let  css='';
	const compiler=new Compiler();

	// const getFileContent=i=>{
	// 	let text=fs.readFileSync(Path.join(indir,sources[i].name),'utf8');
	// 	if (text.indexOf('\r')) text=text.replace(/\r?\n/g,'\n').replace(/\r/g,'\n');
	// 	return {text};
	// }
	for (let i=0;i<files.length;i++) {
		const name=files[i];
		if (name=='accelon22.css') {
			css=fs.readFileSync( Path.join(indir,name),'utf8');
			continue;
		}
		let text=fs.readFileSync( Path.join(indir,name), 'utf8');
		if (text.indexOf('\r')) text=text.replace(/\r?\n/g,'\n').replace(/\r/g,'\n');
		if (!text.trim()) {
			console.log('empty file',name);
			continue;
		}
		if (name.endsWith(PTK.PGDEXT)){
			const paged=new PTK.Paged()
			paged.loadFromString(text,name.replace(PTK.PGDEXT,''));
			const [off,tsv]=paged.dumpOffTsv();
			sources.push({name:paged.name+'.off',text:off});
			sources.push({name:paged.name+'.tsv',text:tsv});
		} else {
			sources.push({name,text});
		}
		process.stdout.write('\r adding'+files[i]+ '  '+(i+1)+'/'+files.length+'        ');
	}
	compiler.ptkname=opts.ptkname; //incase no 0.off
	lbaser=await PTK.makeLineBaser(sources,compiler);

	css=css||PTK.cssSkeleton(compiler.typedefs, compiler.ptkname);

	let written=0,outfn='';
	process.stdout.write('\r');
	const folder=outdir+lbaser.name+'/';
	if (!fs.existsSync(folder) && opts.jsonp) fs.mkdirSync(folder);
	if (typeof lbaser=='string') { //fatal
		console.log(red(lbaser))
	} else {
		if (opts.jsonp) {
			lbaser.dumpJs((fn,buf)=>{
				if (writeChanged(folder+fn,buf)) {
					written+=buf.length;
				}
			});
			writeChanged(folder+'accelon22.css',css);
		} else {
			let image;
			if (com) {  //build with redbean
				image=fs.readFileSync(com);//along with bin.js
			}
			const ptkimage=makeInMemoryPtk(lbaser,css,image);
			outfn=outdir+lbaser.name+(com?'.com':'.ptk');
			await fs.writeFileSync(outfn,ptkimage);
			written=ptkimage.length;
		}
		console.log('total page',lbaser.pagestarts.length,'          ');
		console.log(jsonp?cyan(outdir+compiler.ptkname+'/*.js'):cyan(outfn),...humanBytes(written));
	}
}