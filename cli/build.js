import * as PTK from '../nodebundle.cjs';
//import kluer from './kluer.js'
import {cyan,blue,yellow,red,bgWhite} from './colors.cjs';

const {LineBaser,makePtk,Compiler,writeChanged,humanBytes} = PTK;
const filelist=files=>files.length>10?[files.length,files.slice(0,10)]:[files.length,files];

export const dobuild=async (files, opts={})=>{
	const jsonp=opts.jsonp;
	const com=opts.com;
	const [filecount, list]=filelist(files);
	console.log('input', filecount,'files', list,((filecount>list.length)?'...':'')  );
	const outdir=opts.outdir||'';
	const indir=opts.indir||'';
	const lbaser=new LineBaser();
	const ctx={lbaser,primarykeys:{}};
	let success=true , css='', alldefines=[];
	const compiler=new Compiler();

	for (let i=0;i<files.length;i++) {
		const filename=files[i];
		if (filename=='accelon22.css') {
			css=fs.readFileSync(indir+filename,'utf8');
			continue;
		}
		const content=fs.readFileSync( indir+filename, 'utf8');
		if (!content.trim()) {
			console.log('empty file',filename);
			continue;
		}
		process.stdout.write('\r adding'+files[i]+ '  '+(i+1)+'/'+files.length+'        ');
		const {name,errors,sourcetype,processed,samepage,preload,defines}
			=compiler.compileBuffer(content, files[i]);
		alldefines.push(...defines);
		css=css||PTK.cssSkeleton(compiler.typedefs, compiler.ptkname);
		if (preload) lbaser.header.preload.push(name);
		if (errors.length==0) {
			lbaser.append( processed, {name,samepage,type:sourcetype});
		} else {
			console.log('errors',errors.length,errors.slice(0,5))
			success=false;
			break;
		}
	}
	if (opts.ptkname!==compiler.ptkname) {
		console.log('\n',red('rename'), 
			cyan(opts.ptkname), '>>', cyan(compiler.ptkname));
	}
	if (!compiler.ptkname) {
		console.log(red('missing ptk name'));
		return ;
	} else if (success) {

		/* combine compiled files and send to LineBaser*/
		lbaser.setName(compiler.ptkname);
		lbaser.payload=alldefines.join('\n');

		for (let tag in compiler.typedefs) {
			const serialized=compiler.typedefs[tag].serialize();
			const name='^'+tag; 
			serialized && lbaser.append( serialized, {name,newpage:true,samepage:true,type:'tag'});
		}


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
			if (com) {
				image=fs.readFileSync(opts.comfilename);//along with bin.js
			}
			const zipbuf=makePtk(lbaser,image,css);
			if (zipbuf) {
				outfn=outdir+lbaser.name+(com?'.com':'.ptk');
				await fs.writeFileSync(outfn,zipbuf);
				written=zipbuf.length;
			}
		}
		console.log('total page',lbaser.pagestarts.length,'          ');
		console.log(jsonp?cyan(outdir+compiler.ptkname+'/*.js'):cyan(outfn),...humanBytes(written));
	}
}