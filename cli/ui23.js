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
    const writeTemplateContent=(fn,outdir='')=>{
        const content=readTextContent(__dirname+fn)
        .replace(/\$APPNAME\$/g,appname)
        .replace(/\$PORT\$/g,devport);
        writeChanged(outdir+fn.replace('appname',appname),content,true);    
    }
    const writeTemplateFile=(fn,outdir='')=>{
        const content=fs.readFileSync(__dirname+fn);
        fs.writeFileSync(outdir+fn.replace('appname',appname),content);
    }
    if (!existsSync('.git')) {
        console.log('not a github repo')
        return;
    }

    //make dist folder
    if (!existsSync('dist')) {
        mkdirSync('dist');
    }

    //make dist folder
    if (!existsSync('src')) {
        mkdirSync('src');
    } else {
        console.log('cannot overwrite existing ui')
        // return
    }    

    if (!existsSync('off')) {
        mkdirSync('off');
    } else {
        console.log('cannot overwrite existing off text files')
        // return
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

    writeChanged('dev.cmd','npm run dev',true);

    writeChanged('dev.js', dev.replace('5001',devport),true);
    
    writeTemplateContent("package.json");
    writeTemplateFile("tsconfig.json");
    writeTemplateFile("rollup.config.ts");

    writeTemplateContent('index.ts', srcdir);
    writeTemplateContent('app.svelte', srcdir);
    writeTemplateContent('appstore.js',srcdir);
    writeTemplateContent('main.svelte',srcdir);

    writeTemplateContent('0.off',offdir);
    writeTemplateContent('appname.off',offdir);
    
    console.log(blue('install dependencies'))
    console.log('npm i');
    console.log(blue('rebuild database'))
    console.log('ptk ptk');
    console.log(blue('dev mode'))
    console.log('npm run dev')
}
