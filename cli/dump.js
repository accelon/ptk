import {readTextContent,meta_cbeta,DOMFromString,xpath,
    writeChanged,filesFromPattern, walkDOM} from '../nodebundle.cjs'

const onOpen={
    lb:(el,ctx)=> {
        ctx.out+=ctx.vol+'p'+el.attrs.n+'\t';
    },
    pb:(el,ctx)=>{
        ctx.vol=el.attrs['xml:id'].slice(0,3);
    },
    note:(el,ctx)=>{ctx.hide=true; },
}
const onClose={
    note:(el,ctx)=>{ ctx.hide=false; },
}
const onText=(t,ctx)=>{
    t=t.replace(/\[([a-z]+)\d*_([_A-Za-z\d]+)\]/g,(m,type,gid)=>{
        if (type=='mc') {
            return ctx.charmaps[gid];
        } else if (type=='cf') {
            return '';
        }
    })
    return ctx.hide?'':t;
}
const tei_plaintext=(content)=>{
    const ctx={};
    const el=DOMFromString(content);
    const charmaps=meta_cbeta.buildCharMap(el); //CB缺
    ctx.charmaps=charmaps;
    const body=xpath(el,'text/body');
    walkDOM(body,ctx,onOpen,onClose,onText);
    return ctx.out.replace(/\n+/g,'\n');
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
export const dump=(arg,arg2)=>{
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
        files.length=100;
        dump_cbeta(files, set)
        console.timeEnd('dump');
    } else {
        console.log('supported dataset')
        console.log('ptk dump cbeta folder');
    }

}