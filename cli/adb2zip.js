import * as colors from './colors.cjs'; // lukeed/kleur
const {red} = colors;
import {openADB, dumpAll} from 'adbjs'
import { storeZip,writeChanged } from '../nodebundle.cjs';

export const adb2zip=(arg,arg2)=>{
    console.log('decompile adb to a zip file');
    if (!arg) {
        console.log(red('missing adb filename'));
        return ;
    }
    if (!fs.existsSync(arg) ) {
        console.log(red('file not file'),arg);
        return;
    }
    const buf=fs.readFileSync(arg,null).buffer;
    const handle=new openADB(buf);
    if (!handle || handle.error) {
        console.log(red(handle.error||'wrong adb'));
        return;
    }
    const files=dumpAll(handle);
	const newzipbuf = storeZip(files);
    const outfn=handle.header.dbname+'.zip';
	writeChanged(outfn,newzipbuf,true); 
}