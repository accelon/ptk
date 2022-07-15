import * as PTK from '../nodebundle.cjs';
import kluer from './kluer.js'
const {blue,yellow,red,bgWhite} = kluer;
const {LineBaser,makePtk,parseOfftextLine,Compiler,writeChanged,humanBytes} = PTK;
const filelist=files=>files.length>10?['<<(first 10)',files.length,files.slice(0,10).join(',')]:['<<',files.length,files.join(',')];
export const dobuild=async (files, opts={})=>{
	const jsonp=opts.jsonp;
	const com=opts.com;
	console.log(...filelist(files))
	const lbaser=new LineBaser();
	const ctx={lbaser,primarykeys:{}};
	let success=true;
	const compiler=new Compiler();
	for (let i=0;i<files.length;i++) {
		const content=fs.readFileSync( files[i], 'utf8');
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
	if (!compiler.ptkname) {
		console.log(red('missing ptk name'));
		return ;
	} else if (success) {
		lbaser.setName(compiler.ptkname);
		let written=0,outfn='';
		process.stdout.write('\r');
		const folder='../'+lbaser.name+'/';
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
				outfn='../'+lbaser.name+(com?'.com':'.ptk');
				await fs.writeFileSync(outfn,zipbuf);
				written=zipbuf.length;
			}
		}
		console.log('total page',lbaser.pagestarts.length,'          ');
		console.log(jsonp?blue('../'+compiler.ptkname+'/*.js'):blue(outfn),...humanBytes(written));
	}
}