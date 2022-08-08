import * as PTK from '../nodebundle.cjs';
//import kluer from './kluer.js'
import {cyan,blue,yellow,red,bgWhite} from './colors.cjs';

const {LineBaser,makePtk,Compiler,writeChanged,humanBytes} = PTK;
const filelist=files=>files.length>10?[files.length,files.slice(0,10)]:[files.length,files];

export const dobuild=async (files, opts={})=>{
	const jsonp=opts.jsonp;
	const com=opts.com;
	const [filecount, list]=filelist(files);
	const sources=[];
	console.log('input', filecount,'files', list,((filecount>list.length)?'...':'')  );
	const outdir=opts.outdir||'';
	const indir=opts.indir||'';
	let lbaser=new LineBaser();
	const ctx={lbaser,primarykeys:{}};
	let success=true , css='', alldefines=[];
	const compiler=new Compiler();
	const getFileContent=i=>{
		return {text:fs.readFileSync(indir+sources[i].name,'utf8')};
	}
	for (let i=0;i<files.length;i++) {
		const name=files[i];
		if (name=='accelon22.css') {
			css=fs.readFileSync(indir+name,'utf8');
			continue;
		}
		const text=fs.readFileSync( indir+name, 'utf8');
		if (!text.trim()) {
			console.log('empty file',name);
			continue;
		}
		sources.push({name});
		process.stdout.write('\r adding'+files[i]+ '  '+(i+1)+'/'+files.length+'        ');
	}
	lbaser=await PTK.makeLineBaser(sources,compiler,getFileContent);

	css=css||cssSkeleton(compiler.typedefs, compiler.ptkname);

	let written=0,outfn='';
	process.stdout.write('\r');
	const folder=outdir+lbaser.name+'/';
	if (!fs.existsSync(folder)) fs.mkdirSync(folder);

	if (opts.jsonp) {
		lbaser.dump((fn,buf)=>{
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