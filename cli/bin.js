#!/usr/bin/env node
import path from 'path';
import kluer from './kluer.js' 
const {blue,yellow,red,bgWhite} = kluer;
import {dobuild} from './build.js';
import * as PTK from '../nodebundle.cjs';
await PTK.nodefs;

const cmd=process.argv[2] || '-h';
const arg=process.argv[3];
const arg2=process.argv[4];
const foldername=process.cwd();
export const getModulePath=name=>{
    let dir=decodeURI(new URL(import.meta.url).pathname);
    if(import.meta.url.substr(0,5)==='file:' && path.sep==='\\') dir=dir.substr(1);
    return path.resolve(dir ,"..")+path.sep+name;
}

const build=opts=>{
	const files=fs.readdirSync('.').filter(it=>it.endsWith('.off')||it.endsWith('.tsv'));
	let name=foldername.match(/([^\\\/]+)$/)[1];

	if (files.length) {
		dobuild(files,opts);
	} else {
		console.log(red("no source in current working directory"));
	}
}
const jsonp=()=>build({jsonp:true});
const com=()=>{
	let acceloncom=getModulePath('accelon22.com');
	if (!fs.existsSync(acceloncom)) {
		console.log('com image not found ',blue(acceloncom))
		return 
	}
	build({com:true,comfilename:acceloncom});
}

const help=()=>{
    console.log('Description: ')
    console.log(' Pitaka command line interface')
    console.log('\nUsage: ')
    console.log(yellow('$ ptk build'), 'build a ptk zip')
    console.log(yellow('$ ptk jsonp'), 'build a folder of jsonp')
    console.log(yellow('$ ptk com'), 'build a com executable')
}

try {
    await ({'--help':help,'-h':help,build,jsonp,com})[cmd](arg);

} catch(e) {
    console.log( kluer.red('error running command'),cmd)
    console.log(e)
}
