export enum TokenType { 
    UNSEARCHABLE=0x1,
    SEARCHABLE=0x10,
    ROMANIZE=20,
    CJK=0x30,
    CJK_BMP=0x31,
    CJK_SURROGATE=0x32
};

import {CJKWord_Reg,Word_tailspace_Reg} from './constants.js'

export type Token = {text:string, choff:number, tkoff:number, type:TokenType};

function Token(text:string='', choff:number=0, tkoff:number, type:TokenType){
    return {text,choff,tkoff,type}
}

export const tokenize=(text:string)=>{
    const out:Token[]=[];
    let i=0, tkoff=0;
    while (i<text.length) {
        let code=text.codePointAt(i);
        if (code>0xffff) {
            const sur=String.fromCodePoint(code); 
            out.push(Token(sur,i,tkoff,TokenType.CJK_SURROGATE));
            tkoff++;
            i+=2;
            continue;
        } else if (code>=0x2000&&code<=0xffff) {
            const tt=(code>=2e80&&code<=0x2fff) //radical
                ||(code>=0x3041&&code<=0x9fff) //0xpunc
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
        while (code<0x2000) {
            s+=text[j];
            code=text.codePointAt(++j)
        }
        s.replace(Word_tailspace_Reg,(m,m1,offset)=>{
            if (offset>prev) {
                out.push(Token(s.substring(prev,offset) , prev+i,tkoff,TokenType.UNSEARCHABLE));
            }
            while (s[offset]==' ') offset++;
            out.push(Token(m1,i+offset,tkoff,TokenType.ROMANIZE));
            tkoff++;
            prev=offset+m.length;
        });
        if (prev<s.length) out.push(Token(s.substring(prev)  ,prev+i,tkoff,TokenType.UNSEARCHABLE ));
        i=j;
    }
    return out;
}