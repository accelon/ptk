import {Offtext,Offtag,IRenderUnit} from './interfaces.ts';
import {AUTO_TILL_END,ALWAYS_EMPTY} from './constants.ts';
import {tokenize,TokenType,Token} from '../fts/index.ts';
import {parseOfftext} from './parser.ts';
import {closeBracketOf} from '../utils/cjk.ts';

export class RenderUnit implements IRenderUnit {
    constructor (token: Token, ntoken:number) {
        this.token=token;
        this.seq=token.choff; //for sorting
        this.text=token.text; //perform text transformation here
        this.ntoken=ntoken;   //base on a concrete token
        this.css='';
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
export const renderOfftext=(linetext, opts={})=>{
    const extra=opts.extra||[];
    const ltp=opts.linetokenpos||0;
    const [plain,tags]=parseOfftext(linetext);
    const runits=tokenize(plain).map( (tk,idx) => {
        return new RenderUnit(tk,idx);
    });

    const classes=[]; //classes at plain position
    let uidx=0;
    //set the classes
    for (let i=0;i<tags.length;i++) {
        const tag=tags[i];
        for (let j=tag.choff;j<tag.choff+tag.width;j++) {
            if (!classes[j]) classes[j]=[];
            classes[j].push(tag.name);
        }
        let at=indexOfCharPos(runits, tag.choff ,uidx);
        if (~at) {
            runits[at].open=tag;
            uidx=at;
            at=indexOfCharPos(runits, tag.choff+tag.width-1 , at);
            if (~at) runits[at].close=tag;
        }
    }

    for (let i=0;i<runits.length;i++) {
        const ru=runits[i];
        if (classes[ru.token.choff]) {
            ru.css+=classes[ru.token.choff]+' ';
        }        
        const bracket=closeBracketOf(ru.text);
        if (ru.hide|| (ru.open && bracket)) {
            ru.css+='hide ';
            const closeAt=findUnitText(runits, bracket, i+1);
            if(closeAt && closeAt.close) closeAt.hide=true;
        }
    }

    return runits;
}