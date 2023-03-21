#!/usr/bin/env node
import * as colors from './colors.cjs'; // lukeed/kleur
const {blue,yellow,red,cyan,underline,magenta,green} = colors;
import {dobuild} from './build.js';
import * as PTK from '../nodebundle.cjs';
import {onelexicon, text_lexicon, lexicons} from './textutils.js'
import nGram from './ngram.js';
import {xmltag} from './xml.js';
import {markj} from './markj.js';
import {markid} from './markid.js';
import {dump} from './dump.js';
import {adb2zip} from './adb2zip.js';
import {ts} from './subtitle.js'
import Path from 'path';

await PTK.nodefs;

const listfilename='files.txt';  //readdir if listfile is missing

const cmd=process.argv[2] || '-h';
const arg=process.argv[3];
const arg2=process.argv[4];
const foldername=process.cwd();

export const getModulePath=name=>{
    let dir=decodeURI(new URL(import.meta.url).pathname);
    if(import.meta.url.slice(0,5)==='file:' && Path.sep==='\\') dir=dir.slice(1);
    return Path.resolve(dir ,"..")+Path.sep+name;
}
const isSourceFile=fn=>{
    return fn.endsWith('.off')||fn.endsWith('.tsv')
}
const build=opts=>{
    let files;
    let ptkname=arg;

    if (!ptkname) { //pack all files in cwd
        if (fs.existsSync("off")) {
            opts.ptkname=Path.basename(process.cwd()).replace(/\..+$/,'');    
            opts.indir='off/'
            files=fs.existsSync(opts.indir+listfilename)?PTK.readTextLines(opts.indir+listfilename):fs.readdirSync(opts.indir).filter(isSourceFile);
        } else {
            files=fs.existsSync(listfilename)?PTK.readTextLines(listfilename):fs.readdirSync('.').filter(isSourceFile);
            opts.outdir='../';
            opts.ptkname=Path.basename(process.cwd()).replace(/\..+$/,'');    
        }
    } else { //pack all files in off
        opts.ptkname=ptkname;
        opts.indir=ptkname+'.offtext/'

        files=fs.existsSync(opts.indir+listfilename)?PTK.readTextLines(opts.indir+listfilename):fs.readdirSync(opts.indir).filter(isSourceFile);

        if (!files.length) {
            opts.indir=ptkname+'.src/'
            files=fs.readdirSync(opts.indir).filter(isSourceFile);
        }
    }
    if (fs.existsSync(opts.indir+'accelon22.css')) {
        files.push('accelon22.css')
    }
    if (!PTK.validPtkName(opts.ptkname)) {
        console.log(cyan(opts.ptkname),'does not match',PTK.regPtkName);
        return;
    }
    console.log('indir',opts.indir);
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

const process_ngram=(lines,fn)=>{
    const gram=parseInt(arg2)||2;
    let stockgram=null;
    if (gram>2) {
        stockgram={};
        const items=PTK.readTextLines(fn+'-ngram'+(gram-1));
        for (let i=0;i<items.length;i++) {
            const [gram,count]=items[i].split(',')
            stockgram[gram]=count;
        }
    }
    const tasker=new nGram({gram,stockgram});
    tasker.add(lines);
    const {result}=tasker.dump();
    
    return result;
}
const ngram=()=>onelexicon('ngram'+(parseInt(arg2)||2), process_ngram);

const help=()=>{
    console.log(yellow('command 指令'), cyan('mandatory 必要'),magenta('optional 选择性'))
    console.log(cyan('file'),'plain text file in utf8 ，纯文本');
    console.log(cyan('lexicon'),'plain text file in utf8, one lemma per line 词典文本，一行一词');
    console.log(magenta('ptkname'),'a-z only, no number and _ 限英文小写字母');
    console.log('src file in 源文件在', cyan('ptkname.offtext') ,'or',cyan('ptkname.src'),'or',cyan('off'));
    console.log(underline('Making Pitaka 制作'));
    console.log('$',yellow('ptk ptk '),magenta('ptkname'), 'pack into a ptk file(zip)   打包成ptk(zip)文件',cyan('ptkname.ptk'))
    console.log('$',yellow('ptk js  '),magenta('ptkname'), '*.js files output to   输出js文件到 ',cyan('ptkname'))
    //console.log('$',yellow('ptk com [lstfile]'),magenta('ptkname'),  'stand-alone executable 制造自足程序 ',cyan('ptkname.com'))
    console.log(underline('Text Processing 文本处理'));
    console.log('$',yellow('ptk unique   '),cyan('file'), 'remove duplicated item 去重复词');
    console.log('$',yellow('ptk dedup    '),cyan('file'), 'find out duplicated item 找出重复词');
    console.log('$',yellow('ptk listwords'),cyan('file'),magenta('lexicon'), 'list words found in lexicon 列出文本中出现的词');
    console.log('$',yellow('ptk ngram    '),cyan('file'),magenta('gram=2'), 'build ngram 找常見詞');
    console.log('$',yellow('ptk dump     '),cyan('dataset'),cyan('srcfolder'),'e.g cbeta 傾倒文本');

    console.log(underline('Lexicon Processing 词典处理'));
    console.log('$',yellow('ptk union    '),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'merge all words in lexicons 词典的联集')
    console.log('$',yellow('ptk intersect'),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'find out common words 词典的交集')
    console.log('$',yellow('ptk xor      '),cyan('lexicon1'),cyan('lexicon2'),magenta('...'),'find out exclusive words 词典的相斥集(非共有)')

    console.log(underline('XML Processing XML处理'));    
    console.log('$',yellow('ptk xmltag   '),cyan('file'),magenta('outdir'),'xml to tag and plain text拆分為標籤及純文字');

    console.log(underline('Markup 標記处理'));
    console.log('$',yellow('ptk markj    '),cyan('address'),cyan('txtfile'),cyan('pattern'),'find origtext 找原書出處');
    console.log('$',yellow('ptk markid   '),cyan('address'),cyan('txtfile'),'fill id, 補上 id');

    console.log('$',yellow('ptk adb2zip  '),cyan('filename'),'adb to zip ');

    console.log('$',yellow('ptk ts       '),cyan('filename'),'parse subtitle (*.srt) 字幕轉標記');

    console.log('PTK-CLI ver',green('2023.3.18'));
}

try {
    await ({'--help':help,'-h':help,ptk,js,com,dedup,unique,listwords,
    union,ngram,intersect,xor,xmltag,dump,markj,markid,adb2zip,ts})[cmd](arg,arg2);

} catch(e) {
    console.log( red('error running command'),cmd)
    console.log(e)
}