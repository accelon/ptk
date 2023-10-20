import {dobuild} from './build.js';
import * as PTK from '../nodebundle.cjs';
import * as colors from './colors.cjs'; // lukeed/kleur
import Path from 'path';
const {blue,red,cyan} = colors;

const arg=process.argv[3];
const isSourceFile=fn=>{
    return fn.endsWith('.off')||fn.endsWith('.tsv')||fn.endsWith('.num')
}

export const builder=opts=>{
    let files;
    let ptkname=arg;
    
    if (!ptkname) { //pack all files in cwd
        if (fs.existsSync("off")) {
            opts.ptkname=Path.basename(process.cwd()).replace(/\..+$/,'');    
            opts.indir='off/'
            const listfilename=opts.ptkname+'.lst';
            files=fs.existsSync(listfilename)?PTK.readTextLines(listfilename):fs.readdirSync(opts.indir);
        } else {
            opts.ptkname=Path.basename(process.cwd()).replace(/\..+$/,'');    
            const listfilename=opts.ptkname+'.lst';
            files=fs.existsSync(listfilename)?PTK.readTextLines(listfilename):fs.readdirSync('.')
            opts.outdir='../';
        }
    } else { //pack all files in off
        opts.ptkname=ptkname;
        opts.indir=ptkname+'.offtext/'
        const listfilename=ptkname+'.lst';  //readdir if listfile is missing
        files=fs.existsSync(opts.indir+listfilename)?PTK.readTextLines(opts.indir+listfilename):fs.readdirSync(opts.indir);
        if (!files.length) {
            opts.indir=ptkname+'.src/'
            files=fs.readdirSync(opts.indir).filter(isSourceFile);
        }
    }
    files=files.filter(isSourceFile);
    if (fs.existsSync(opts.indir+'accelon22.css')) {
        files.push('accelon22.css')
    }
    if (!PTK.validPtkName(opts.ptkname)) {
        console.log(cyan(opts.ptkname),'does not match',PTK.regPtkName);
        return;
    }
    console.log('indir',opts.indir);
	if (files.length) {
        const thebuilder=opts.builder||dobuild
		thebuilder(files,opts);
	} else {
		console.log(red("no source in current working directory"));
	}
}

export const js=()=>builder({jsonp:true});
export const com=()=>{
	let acceloncom=getModulePath('accelon22.com');
	if (!fs.existsSync(acceloncom)) {
		console.log('com image not found ',blue(acceloncom))
		return 
	}
	builder({com:true,comfilename:acceloncom});
}
export const ptk=()=>{
    builder({jsonp:false,com:false})
}