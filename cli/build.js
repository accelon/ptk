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
	let success=true;
	const compiler=new Compiler();
	// compiler.ptkname=opts.ptkname; //suggestion only, might overwrite by offtext
	for (let i=0;i<files.length;i++) {
		const content=fs.readFileSync( indir+files[i], 'utf8');
		if (!content.trim()) {
			console.log('empty file',files[i]);
			continue;
		}
		process.stdout.write('\r adding'+files[i]+ '  '+(i+1)+'/'+files.length+'        ');
		const {name,errors,processed,samepage}=compiler.compileBuffer(content, files[i]);
		if (errors.length==0) {
			lbaser.append( processed, {name,samepage});	
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
		lbaser.setName(compiler.ptkname);
		let written=0,outfn='';
		process.stdout.write('\r');
		const folder=outdir+lbaser.name+'/';
		if (!fs.existsSync(folder)) fs.mkdirSync(folder);
		if (opts.jsonp) {
			lbaser.dump((fn,buf)=>{
				if (writeChanged(folder+fn,buf)) {
					written+=buf.length;
				}
			})
		} else {
			let image;
			if (com) {
				image=fs.readFileSync(opts.comfilename);//along with bin.js
			}
			const zipbuf=makePtk(lbaser,image);
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