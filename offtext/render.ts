import {Offtext,Offtag,IRenderUnit} from './interfaces.ts';
import {AUTO_TILL_END,ALWAYS_EMPTY} from './constants.ts';
import {tokenize,TokenType,Token} from '../fts/index.ts';
import {parseOfftext,Offtext} from './parser.ts';
import {closeBracketOf} from '../utils/cjk.ts';

export class RenderUnit implements IRenderUnit {
    constructor (token: Token, ntoken:number, offtext:IOfftext) {
        this.token=token;
        this.choff=token.choff; //for sorting
        this.text=token.text; //perform text transformation here
        this.ntoken=ntoken;   //base on a concrete token
        this.offtext=offtext; //the offtext object
        this.tags=[];         //tags covering this token
        this.hide=false;
    }
}  

const findUnitText=(runits:RenderUnit[], text:string, from=0)=>{
    for (let i=from;i<runits.length;i++) {
        if (runits[i].token.text===text) return runits[i];
    }
}
const indexOfCharPos=(runits:RenderUnit[], choff:number , from=0)=>{
    for (let i=from;i<runits.length;i++) {
        if (runits[i].token.choff===choff) return i;
    }
    return -1
}
export const gerRenderUnitClasses=(ru:RenderUnit,prepend='',append='')=>{
    const css=[];
    css.push(prepend);
    const ot=ru.offtext;
    for (let j=0;j<ru.tags.length;j++) {
        const tag=ot.tags[ru.tags[j]];
        css.push(tag.name);
        if (tag.active) css.push(tag.name+'_active');
    }
    css.push(append);
    ru.hide&&css.push('hide');
    return css.join(' ');
}
export const renderOfftext=(linetext:string, opts={})=>{
    const extra=opts.extra||[];
    const ltp=opts.linetokenpos||0;
    // const [plain,tags]=parseOfftext(linetext);
    const ot=new Offtext(linetext);
    const runits=tokenize(ot.plain).map( (tk,idx) => {
        return new RenderUnit(tk,idx, ot);
    });
    const tagsAt=[]; //tags at plain position
    let uidx=0;

    for (let i=0;i<ot.tags.length;i++) {
        const tag=ot.tags[i];
        for (let j=tag.choff;j<tag.choff+tag.width;j++) {
            if (!tagsAt[j]) tagsAt[j]=[];
            tagsAt[j].push(i);
        }
    }

    for (let i=0;i<runits.length;i++) {
        const ru=runits[i];
        ru.tags=tagsAt[ru.token.choff]||[];
        const bracket=closeBracketOf(ru.text);
        if (ru.hide|| (ru.tags.length && bracket)) {
            ru.hide=true;
            const closeAt=findUnitText(runits, bracket, i+1);
            if(closeAt) closeAt.hide=true;
        }
    }

    return runits;
}