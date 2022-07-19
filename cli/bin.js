#!/usr/bin/env node
import Path from 'path';
import {blue,yellow,red,cyan,green,bold,underline,magenta} from './colors.cjs'; // lukeed/kleur
import {dobuild} from './build.js';
import * as PTK from '../nodebundle.cjs';
import {onelexicon, text_lexicon, lexicons} from './textutils.js'
await PTK.nodefs;

const cmd=process.argv[2] || '-h';
const arg=process.argv[3];
const arg2=process.argv[4];
const foldername=process.cwd();
export const getModulePath=name=>{
    let dir=decodeURI(new URL(import.meta.url).pathname);
    if(import.meta.url.substr(0,5)==='file:' && Path.sep==='\\') dir=dir.substr(1);
    return Path.resolve(dir ,"..")+Path.sep+name;
}
const isSourceFile=fn=>{
    return fn.endsWith('.off')||fn.endsWith('.tsv')||fn=='ptk.css'
}
const build=opts=>{
    let files;
    let ptkname=process.argv[3];
    
    if (!ptkname) {
        files=fs.readdirSync('.').filter(isSourceFile);
        opts.outdir='../';
        opts.ptkname=Path.basename(process.cwd()).replace(/\..+$/,'');
    } else {
        opts.ptkname=ptkname;
        opts.indir=ptkname+'.offtext/'
        files=fs.readdirSync(opts.indir).filter(isSourceFile);
        if (!files.length) {
            opts.indir=ptkname+'.src/'
            files=fs.readdirSync(opts.indir).filter(isSourceFile);
        }
    }
    if (!PTK.validPtkName(opts.ptkname)) {
        console.log(cyan(opts.ptkname),'does not match',PTK.regPtkName);
        return;
    }

	if (files.length) {
		dobuild(files,opts);
	} else {
		console.log(red("no source in current working directory"));
	}
}
const js=()=>build({jsonp:true});
const com=()=>{
	let acceloncom=getModulePath('accelon22.com');
	if (!fs.existsSync(acceloncom)) {
		console.log('com image not found ',blue(acceloncom))
		return 
	}
	build({com:true,comfilename:acceloncom});
}
const ptk=()=>{
    build({jsonp:false,com:false})
}
export const unique=()=>onelexicon('unique', PTK.unique);
export const dedup=()=>onelexicon('dedup', PTK.dedup);
export const listwords=()=>text_lexicon('listwords', PTK.listwords);
export const intersect=()=>lexicons('intersect',PTK.lexiconIntersect);
export const union=()=>lexicons('union', PTK.lexiconUnion);
export const xor=()=>lexicons('xor', PTK.lexiconXor);

const help=()=>{
    console.log(yellow('command 指令'), cyan('mandatory 必要'),magenta('optional 选择性'))
    console.log(cyan('file'),'plain text file in utf8 ，纯文本');
    console.log(cyan('lexicon'),'plain text file in utf8, one lemma per line 词典文本，一行一词');
    console.log(magenta('ptkname'),'a-z only, no number and _ 限英文小写字母');
    console.log('src file in 源文件在', cyan('ptkname.offtext') ,'or',cyan('ptkname.src'));
    console.log('if ptkname is missing, get source files from cwd and output to parent directory');
    console.log('缺少ptkname 则从当前目彔获取源文件');
    console.log(underline('Making Pitaka 制作'));
    console.log('$',yellow('ptk ptk'),magenta('ptkname'), 'pack into a zip file   打包成zip文件',cyan('ptkname.ptk'))
    console.log('$',yellow('ptk js '),magenta('ptkname'), '*.js files output to   输出js文件到 ',cyan('ptkname'))
    console.log('$',yellow('ptk com'),magenta('ptkname'),  'stand-alone executable 制造自足程序 ',cyan('ptkname.com'))
    console.log(underline('Text Processing 文本处理'));
    console.log('$',yellow('ptk unique   '),cyan('file'), 'remove duplicated item 去重复词');
    console.log('$',yellow('ptk dedup    '),cyan('file'), 'find out duplicated item 找出重复词');
    console.log('$',yellow('ptk listwords'),cyan('file'),magenta('lexicon'), 'list words found in lexicon 列出文本中出现的词');
    console.log(underline('Lexicon Processing 词典处理'));
    console.log('$',yellow('ptk union    '),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'merge all words in lexicons 词典的联集')
    console.log('$',yellow('ptk intersect'),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'find out common words 词典的交集')
    console.log('$',yellow('ptk xor      '),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'find out exclusive words 词典的相斥集(非共有)')
}

try {
    await ({'--help':help,'-h':help,ptk,js,com,dedup,unique,listwords,union,intersect,xor})[cmd](arg);

} catch(e) {
    console.log( red('error running command'),cmd)
    console.log(e)
}
