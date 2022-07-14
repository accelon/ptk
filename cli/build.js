import * as PTK from '../nodebundle.cjs';
import kluer from './kluer.js'
const {blue,yellow,red,bgWhite} = kluer;
const {LineBase,makePtk,parseOfftextLine,Compiler,writeChanged,humanBytes} = PTK;
const filelist=files=>files.length>10?['<<(first 10)',files.length,files.slice(0,10).join(',')]:['<<',files.length,files.join(',')];
export const dobuild=async (name, files, opts={})=>{
	const jsonp=opts.jsonp;
	const com=opts.com;
	console.log(...filelist(files))
	const lbase=new LineBase();
	const ctx={lbase,primarykeys:{}};
	let success=true;
	const compiler=new Compiler();
	for (let i=0;i<files.length;i++) {
		const content=fs.readFileSync( files[i], 'utf8');
		if (!content.trim()) {
			console.log('empty file',files[i]);
			continue;
		}
		process.stdout.write('\r adding'+files[i]+ '  '+(i+1)+'/'+files.length+'        ');
		const {errors,processed,samepage}=compiler.compileBuffer(content, files[i]);
		if (errors.length==0) {
			lbase.append( processed, {name:files[i],samepage});	
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
		lbase.setName(compiler.ptkname);
		let written=0,outfn='';
		process.stdout.write('\r');
		const folder='../'+lbase.name+'/';
		if (opts.jsonp) {
			lbase.writePages((fn,buf)=>{
				if (writeChanged(folder+fn,buf)) {
					written+=buf.length;
				}
			})
		} else {
			let image;
			if (com) {
				image=fs.readFileSync(opts.comfilename);//along with bin.js
			}
			const zipbuf=makePtk(lbase,image);
			if (zipbuf) {
				outfn='../'+lbase.name+(com?'.com':'.ptk');
				await fs.writeFileSync(outfn,zipbuf);
				written=zipbuf.length;
			}
		}
		console.log('total page',lbase.pagestarts.length,'          ');
		console.log(jsonp?blue('../'+name+'/*.js'):blue(outfn),...humanBytes(written));
	}
}