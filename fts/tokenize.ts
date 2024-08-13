export enum TokenType { 
    UNSEARCHABLE=0x1,
    OFFTAG=0x3,
    SEARCHABLE=0x10,
    ROMANIZE=0x20,
    MYANMAR=0x21,
    CJK=0x30,
    CJK_BMP=0x31,
    CJK_SURROGATE=0x32
}


import {Word_tailspace_Reg} from './constants.ts'

export function Token(text:string, choff:number, tkoff:number, type:TokenType,line:number=0):IToken{
    return {text,choff,tkoff,type}
}
export type IToken = {text:string, choff:number, tkoff:number, type:TokenType,line:number};

export const tokenize=(text:string):IToken[]=>{
    const out:IToken[]=[];
    let i=0, tkoff=0;
    if (typeof text!=='string') return [];
    while (i<text.length) {
        let code=text.codePointAt(i)||0;
        if (code>0xffff) {
            const sur=String.fromCodePoint(code); 
            out.push(Token(sur,i,tkoff,TokenType.CJK_SURROGATE));
            tkoff++;
            i+=2;
            continue;
        } else if (code>=0x2000&&code<=0xffff) {
            const tt=(code>=2e80&&code<=0x2fff) //radical
                ||(code>=0x3041&&code<=0x9fff) //0xbmp
                || (code>=0xd400&&code<0xdfff)  //surrogates
                || (code>=0xe000&&code<0xfadf)? TokenType.CJK_BMP:TokenType.UNSEARCHABLE;

            out.push(Token(text[i],i,tkoff,tt));
            if (tt!==TokenType.UNSEARCHABLE) tkoff++;
            i++;
            continue;
        }
        //space or alpha number
        let s='',prev=0;
        let j=i;
        while (j<text.length && code<0x2000) {
            s+=text[j];
            code=text.codePointAt(++j)||0;
        }
        s.replace(Word_tailspace_Reg,(m,m1,offset)=>{
            if (offset>prev) {
                out.push(Token(s.substring(prev,offset) , prev+i,tkoff,TokenType.UNSEARCHABLE));
            }
            while (s[offset]==' ') offset++;

            out.push(Token(m1,i+offset,tkoff,TokenType.ROMANIZE));
            tkoff++;
            prev=offset+m.length;
            return '';
        });
        if (prev<s.length) out.push(Token(s.substring(prev)  ,prev+i,tkoff,TokenType.UNSEARCHABLE));
        i=j;
    }
    return out;
}

