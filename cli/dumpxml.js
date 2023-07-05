import {readTextContent,meta_cbeta,DOMFromString,xpath,
    writeChanged,filesFromPattern, walkDOM} from '../nodebundle.cjs'

const onOpen={
    lb:(el,ctx)=> {
        const vol=ctx.vol;
        //有些書有舊版頁碼
        const newyinshun=ctx.set=='Y' && (vol<24) || (vol>41) || (vol>24&&vol<31);
        if (newyinshun) { //導師全集用舊版頁碼
            if (el.attrs.type!=='old') return '';
        }
        //因印順以新版換行，加迫加入換行。
        ctx.out+= '\n'+ctx.set+ctx.vol+'p'+el.attrs.n+'\t';
    },
    pb:(el,ctx)=>{
        ctx.vol=parseInt(el.attrs['xml:id'].slice(1,3));
    },
    note:(el,ctx)=>{ctx.hide=true; },
}
const onClose={
    note:(el,ctx)=>{ ctx.hide=false; },
}
const onText=(t,ctx)=>{
    t=t.replace(/\[([a-z\.]+)\d*_([^\]]+)\]+/g,(m,type,gid)=>{
        if (type=='mc') {
            return ctx.charmaps[gid]||'';
        }
        return '';
    })
    return ctx.hide?'':t;
}
const ctx={};
const tei_plaintext=(content)=>{
    const el=DOMFromString(content);
    const charmaps=meta_cbeta.buildCharMap(el); //CB缺字 及unicode/拼形式 對照表
    ctx.charmaps=charmaps;
    const body=xpath(el,'text/body');
    walkDOM(body,ctx,onOpen,onClose,onText);
    let t=ctx.out.replace(/\n+/g,'\n').trim();
    ctx.out='';
    if (ctx.set=='Y') { //因xml 以新版換行，調為舊版
        t=t.replace(/\n([^Y])/g,'$1');
    }
    return t;
}
const dump_cbeta=(files,set)=>{
    const out=[];
    for (let i=0;i<files.length;i++) {
        process.stdout.write('\r'+(i+1)+' '+files[i]+'    ');
        let content=readTextContent(files[i]);
        content=meta_cbeta.nullify(content);
        out.push(tei_plaintext(content));
    }
    writeChanged('cbeta-'+set+'.txt',out.join('\n'),true);
}
export const dumpxml=(arg,arg2)=>{
    if (arg=='cbeta') {
        console.time('dump');
        if (!arg2) {
            console.log('missing  cbeta folder');
            console.log('Full  Taisho   /cbeta/XML/T ');
            console.log('Taisho vol 1   /cbeta/XML/T/T01');
            return;
        }
        const set=arg2[arg2.length-1];
        const files=filesFromPattern(arg2+'/'+set+'*');
        console.log('dumping ',arg2,files.length,'files');
        const at=arg2.lastIndexOf('/')
        ctx.set=arg2.slice(at+1,at+2); //T , Y 
        dump_cbeta(files, arg2.slice(at+1));
        
        console.timeEnd('dump');
    } else {
        console.log('supported dataset')
        console.log('ptk dump cbeta folder');
    }

}