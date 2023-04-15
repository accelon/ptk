import { getInserts,insertText,toBase26 } from "../utils/index.ts";
import { onOfftext } from "../xml/index.js";
const unhide=ctx=>{ (ctx.hide?ctx.hide--:0) };

export const onTextWithInserts=(el,ctx)=>{
    if (ctx.inserts && ctx.inserts.length) {
        el=insertText(el,ctx.inserts);
    }
    return onOfftext(el,ctx);
}
export const onClose={
    'cb:div': (el,ctx)=>{ctx.div--},
    'cb:tt':(el,ctx)=>unhide(ctx),
    'cb:mulu':(el,ctx)=>{
        unhide(ctx);
        if (ctx.mulu && ctx.started) {
            ctx.mulu=false;
            return '">';
        }
    },
    note:(el,ctx)=>unhide(ctx),
    lem:(el,ctx)=>unhide(ctx),
    // l:(el,ctx)=>{ 
    //     if (ctx.snippet.substr(ctx.snippet.length-1)=='。') {
    //         ctx.compact=true;
    //         return '^r';    
    //     }
    // },
    lg:(el,ctx)=>{
        return '\n'
    },
}
const getPali=pi=>{
    if (pi.indexOf(' ')==-1 ) {//removing tailing .
        if (pi[pi.length-1]=='.')pi=pi.substr(0,pi.length-1);
    } else if (pi[0]!=='"'){
        pi='"'+pi+'"';
    }
    return pi;
}
const pb=(el,ctx)=>{
    ctx.lbcount=0;
    ctx.compact=true;
    let out='', pn=el.attrs.n.replace(/^0+/,'');
    if (ctx.fn.match(/Y\d\dn\d/)) {
        if (pn.charCodeAt(0)>0x40){ 
            out='^pg<'+pn.substr(0,pn.length-1)+'>';
            ctx.compact=false;
        } else if (pn[pn.length-1]!=='a') {//多欄 y21-009 0131b
            out='^pg<'+pn+'>';
            ctx.compact=false;
        } else {
            out='^p'+pn.substr(0,pn.length-1);
            ctx.compact=true;
        }
        if (el.attrs.type==='old') return '';
    } else {
        let vol='';
        ctx.vol=el.attrs['xml:id'].substr(1,2);
        if (el.attrs.n==='0001a') {
            ctx.compact=true;
            vol='^v'+ctx.vol;
        } 

        if (ctx.fn[0]==='N') { //Nanchuan
            out=vol+'^p'+pn.replace(/a$/,'');
            ctx.compact=true;
        } else if (ctx.fn[0]==='T' || ctx.fn[0]==='X'){
            ctx.pn=pn;
            if (vol) {
                out=vol;
                ctx.compact=true;
            }
        }
    }
    return out;
}
const p=(el,ctx)=>{
    if (ctx.prevpn==ctx.pn && ctx.prevlb==ctx.lbcount) {
        return '\n';
    }     
    ctx.prevlb=ctx.lbcount;
    ctx.prevpn=ctx.pn;
    ctx.compact=true;
    return '\n^p'+ctx.pn+ctx.lbcount;
}
const g=(el,ctx)=>{
    if (ctx.hide)return;
    const uni=ctx.charmap[ el.attrs.ref.substr(1)];
    if (uni) return uni;
    else {
        ctx.compact=true;
        return '^mc'+el.attrs.ref.substr(3); //remove #CB
    }
}

const lb=(el,ctx)=>{
    ctx.lbcount++;    
    if (ctx.transclusion[ctx.fn] && el.attrs.type!=='old') {
        ctx.ptr=ctx.transclusion[ctx.fn][el.attrs.n];
    }
    const inserts= getInserts( ctx.milestones, ctx.vol+'p'+el.attrs.n);
    let out='';
    if (inserts) {
        if (ctx.inserts&&ctx.inserts.length) {
            console.log('unclear inserts', ctx.inserts)
        }
        ctx.inserts=null;
        inserts.forEach((ms)=>{
            if (Array.isArray(ms)) { //need to locate the text
                if (!ctx.inserts) ctx.inserts=[];
                ctx.inserts.push(ms); //to be inserted when text is ready
            } else {//number or string
                ctx.compact=true;
                out+=ms;   
            }
        })
    }
    return out;
}
const byline=(el,ctx)=>{
    let s='\n';
    const type=el.attrs['cb:type'];
    if (type) {
        ctx.compact=true;
        s+='^h<o='+type.toLowerCase()+'>';
    }
    return s;
}
// const cbtt=(el,ctx)=>{
//     let s='';
//     const lang=el.children.length>1&&el.children[1].attrs&&el.children[1].attrs['xml:lang'];
//     if (el.children[0].name==='cb:t' && el.children[1].name==='cb:t') {
//         if (lang=='pi') {
//             let pi=getPali(el.children[1].innerText(true)); //take only one level
//             s='^w<'+lang+'='+pi+' '+ el.children[0].innerText(true)+'>';
//         } else {
//             s=el.children[0].innerText(true);
//         }
//     } else {
//         s=el.children[0].innerText(true);

//     }
//     ctx.hide++;
//     return s;
// }
export const caesura=(el,ctx)=>'　';
export const onOpen={
    p,pb,g,lb,byline,caesura,
    milestone:(el,ctx)=>{ctx.started=true;},//skip the redundant mulu before milestone, see T30n1579_037
    note:(el,ctx)=>{  ctx.hide++;return ''},
    l:(el,ctx)=>{ctx.compact=true; return '\n^l'},
    lem:(el,ctx)=>{ ctx.hide+=1},//just keep the rdg
    quote:(el,ctx)=>{
        if (ctx.ptr) {
            const ptr=ctx.ptr;
            ctx.ptr='';
            return '^t@'+ptr;
        }
    },    
    'cb:mulu':(el,ctx)=>{
        if (!ctx.started)return;
        const level=parseInt(el.attrs.level);
        if (level) {// T01 0001b08 , skip cb:mulu without level 
            if (ctx.defs.mu && ctx.defs.mu.compact) {
                ctx.hide++;
                ctx.compact=true;
                return '^z'+toBase26(level-1);
            } else {
                ctx.mulu=true;
                return '^z'+toBase26(level-1)+'<t="';
            }
        }        
    },
    'cb:div': (el,ctx)=>{
        ctx.div++;
        // ctx.compact=true;
        return ctx.fn[0]==='Y'?'\n':'\n^h<o='+el.attrs.type+'>';
    },
    'ref':(el,ctx)=>{
        if (el.attrs.target && el.attrs.type) {
            const ty=el.attrs.type;
            if (ty==='taisho') {
                const m=el.attrs.target.match(/#vol:(\d+);page:p(\d+[abc])/);
                if (m) {
                    return '^q<loc=/cb-t/v#'+m[1]+'/p#'+m[2]+'>';
                }
            }
            // console.log(el.attrs.target)
        }
    }
    // deal with app inside cb:tt <app n="0002008">  t01n0001_001
    /*
    app:(el,ctx)=>{
        ctx.hide++;
        let s='';
        if (el.children[0].name==='lem' && el.children[1].name==='rdg') {
            let lem=el.children[0].innerText(true);
            let rdg=el.children[1].innerText(true);
            s='^ap[o='+lem+(rdg?' '+rdg:'') +']';
        }
        return s;
    }
    */
}
