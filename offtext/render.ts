import {Offtext,Offtag,IRenderUnit} from './interfaces.ts';
import {AUTO_TILL_END,ALWAYS_EMPTY,MIN_ABRIDGE} from './constants.ts';
import {tokenize,TokenType,Token} from '../fts/index.ts';
import {parseOfftext,Offtext} from './parser.ts';
import {closeBracketOf} from '../utils/cjk.ts';

export class RenderUnit implements IRenderUnit {
    constructor (token: Token, ntoken:number, offtext:IOfftext, postingoffset:number) {
        this.token=token;
        this.postingoffset=postingoffset; //relative offset of posting (indexable token)
        this.choff=token.choff; //for sorting
        this.text=token.text; //perform text transformation here
        this.ntoken=ntoken;   //base on a concrete token
        this.offtext=offtext; //the offtext object
        this.tags=[];         //tags covering this token
        this.hide=false;
        this.luminate=0;      //highlight luminates surrounding token, for abridge
        this.highlight=false;
    }
    tags(closing=false){
        const out=[];
        if (!this.tags || !this.tags.length) return '';
        for (let i=0;i<this.tags.length;i++) {
            const tag=this.offtext.getTag(this.tags[i]);
            if (this.choff == tag.choff + (closing?tag.width-1:0)) {
                out.push(this.tags[i]);
            }
        }
        return out;
    }
    closestTag(){
        return this.offtext.getTag(this.tags[this.tags.length-1]);
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
export const getRenderUnitClasses=(ru:RenderUnit,prepend='',append='')=>{
    const css=[];
    css.push(prepend);
    const ot=ru.offtext;
    
    for (let j=0;j<ru.tags.length;j++) {
        const tag=ot.tags[ru.tags[j]];
        css.push(tag.name);
        if (tag.active) css.push(tag.name+'_active');
        
        const hasbracket=closeBracketOf(ru.offtext.tagRawText(tag))?1:0;
        if (ru.choff==tag.choff+hasbracket) css.push(tag.name+'_start');
        if (ru.choff==tag.choff+tag.width-1-hasbracket) css.push(tag.name+'_end');
        
    }
    if (ru.highlight) css.push('highlight');
    css.push(append);
    ru.hide&&css.push('hide');
    return css.join(' ');
}
export const renderOfftext=(linetext:string, opts={})=>{
    const extra=opts.extra||[];
    const hits=opts.hits||[];
    const phraselength=opts.phraselength||[];
    const ltp=opts.linetokenpos||0;
    // const [plain,tags]=parseOfftext(linetext);
    const ot=new Offtext(linetext);
    let postingoffset=0;
    const runits=tokenize(ot.plain).map( (tk,idx) => {
        if (tk.type>=TokenType.SEARCHABLE) postingoffset++;
        const ru= new RenderUnit(tk,idx, ot, postingoffset);
        return ru;
    });
    const tagsAt=[]; //tags at plain position
    let uidx=0 , phit=0;
    
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

        if (hits.length && phit<hits.length) {
            if (ru.postingoffset==hits[phit] && ru.token.type>=TokenType.SEARCHABLE) {
                ru.highlight=true;
            }

            if (hits[phit]<ru.postingoffset) phit++;

            if (ru.highlight) {
                ru.luminate++;
                let j=i+1;
                while (j<runits.length) {
                    if (runits[j].token.type>=TokenType.SEARCHABLE|| j-i<MIN_ABRIDGE) j++;else break;
                    if (j<runits.length) runits[j].luminate++;
                }
                j=i-1;
                while (j>0) {
                    if (runits[j].token.type>=TokenType.SEARCHABLE|| i-j<MIN_ABRIDGE) j--;else break;
                    if (j>=0) runits[j].luminate++;
                }
            }
        }

        const bracket=closeBracketOf(ru.text);
        if (ru.hide|| (ru.tags.length && bracket)) {
            ru.hide=true;
            const closeAt=findUnitText(runits, bracket, i+1);
            if(closeAt) closeAt.hide=true;
        }
    }

    return runits;
}

export const abridgeRenderUnits=(runits:RenderUnit[], minwidth=20)=>{
    const out=[];
    let abridged=[];
    const addAbridge=(final=false)=>{
        if (abridged.length>MIN_ABRIDGE) {
            out.push([abridged.length, abridged[0],final] );
        } else {
            for (let j=0;j<abridged.length;j++) {
                out.push(runits[abridged[j]])
            }
        }
        abridged=[];
    }
    if (runits.length<minwidth) return runits;
    for (let i=0;i<runits.length;i++) {
        const ru=runits[i];
        if (ru.luminate)  {
            addAbridge();
            out.push(ru);
        } else {
            abridged.push(i);
        }
    }
    addAbridge(true);
    return out;
}
