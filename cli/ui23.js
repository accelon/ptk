import {mkdirSync, existsSync} from 'fs';
import { dirname,sep } from 'path';
import { fileURLToPath } from 'url';
import { readTextContent, writeChanged } from '../nodebundle.cjs';
import * as colors from './colors.cjs'; // lukeed/kleur
const {blue,yellow,red,cyan,underline,magenta,green} = colors;

const __filename = fileURLToPath(import.meta.url);
const __dirname=dirname(__filename)+sep+'ui23'+sep;
const distdir='dist'+sep;
const srcdir='src'+sep;
const offdir='off'+sep;

const dev=`import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
let ctx=await esbuild
.context({
    entryPoints: ["src/index.ts"],
    mainFields: ["svelte", "browser", "module", "main"],
    external:[],
    bundle: true,
    //minify :true,
    outfile: "dist/index.js",
    plugins: [sveltePlugin()],
    logLevel: "info",
  })
  .catch(() => process.exit(1));
//await ctx.watch();
 await ctx.serve({
      servedir: 'dist',
      port:5001,
      host:"127.0.0.1"
 })`


export const ui23=(appname,devport=5001)=>{
    let cwd=process.cwd().slice(process.cwd().lastIndexOf(sep)+1);
    
    if (!appname) appname=cwd;
    const writeTemplateContent=(fn,outdir='')=>{
        const content=readTextContent(__dirname+fn)
        .replace(/\$APPNAME\$/g,appname)
        .replace(/\$PORT\$/g,devport);
        writeChanged(outdir+fn.replace('appname',appname),content);    
    }
    const writeTemplateFile=(fn,outdir='')=>{
        const content=fs.readFileSync(__dirname+fn);
        fs.writeFileSync(outdir+fn.replace('appname',appname),content);
    }
    if (!existsSync('.git')) {
        console.log(red('warning ! not a github repo'))
    }

    //make dist folder
    if (!existsSync('dist')) mkdirSync('dist');

    //make dist folder
    if (!existsSync('src')) {
        mkdirSync('src');
    } else {
        console.log(red('existing src'))
        return
    }
    if (!existsSync('off')) {
        mkdirSync('off');
    } else {
        console.log(red('existing off/*'))
        return
    }
    const engdir=appname+'-en.offtext'
    if (!existsSync(engdir)) {
        mkdirSync(engdir);
    }
    const rudir=appname+'-ru.offtext'
    if (!existsSync(rudir)) {
        mkdirSync(rudir);
    }

    writeTemplateContent('appname.manifest',distdir);
    writeTemplateContent('sw.js',distdir);
    writeTemplateContent('index.html',distdir);
    writeTemplateContent('offline.html',distdir);
    writeTemplateContent('global.css',distdir);
    writeTemplateContent('index.css',distdir);
    writeTemplateFile('appname.png',distdir);
    writeTemplateFile('appname512.png',distdir);
    writeTemplateFile('global.css',distdir);
    writeTemplateFile('ProvidentPaliSegoe.otf',distdir);

    writeChanged('dev.cmd','npm run dev');
    writeChanged('.gitignore',`*.ptk\nnode_modules\ndist`);
  
    writeTemplateContent("package.json");
    writeTemplateFile("tsconfig.json");
    writeTemplateFile("rollup.config.js");

    writeTemplateContent('index.ts', srcdir);
    writeTemplateContent('appstore.js',srcdir);

    writeChanged(offdir+'/0.off','^:<ptk='+appname+' zh=中文名 lang=zh>');
    writeTemplateContent('appname.off',offdir);
  
    writeChanged(engdir+'/0.off','^:<ptk='+appname+'-en zh=英文名 en=Name lang=en>');
    writeTemplateContent('appname.en.off',engdir+'/');

    writeChanged(rudir+'/0.off','^:<ptk='+appname+'-ru zh=俄文名 ru=Русский en=Name lang=ru>');
    writeTemplateContent('appname.ru.off',rudir+'/');

    console.log(cyan('install dependencies(take few minutes)'))
    console.log('npm i');
    console.log(cyan('rebuild database'),yellow('off/*.off'))
    console.log('ptk ptk');
    console.log(cyan('rebuild english'),yellow(appname+'-en.offtext/*.off'))
    console.log('ptk ptk '+appname+'-en');
    console.log(cyan('dev mode'))
    console.log('npm run dev');

    console.log(cyan('build release'))
    console.log('npm run build')
    
}
