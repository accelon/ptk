export const TOKEN_UNSEARCHABLE=0x1,TOKEN_SEARCHABLE=0x10,
TOKEN_ROMANIZE=20,TOKEN_CJK=0x30,
TOKEN_CJK_BMP=0x31,TOKEN_CJK_SURROGATE=0x32;
export const TOKEN_ID_UNKNOWN=-1;
export const TK_WEIGHT=0,TK_POSTING=1,TK_NAME=2,TK_OFFSET=3,TK_TYPE=4;
export const LINETOKENGAP=5;

import {CJKWord_Reg,Word_tailspace_Reg} from './constants.js'

function Token(text:string='', at:number=0, tokentype:number=TOKEN_UNSEARCHABLE){
    return {text,at,tokentype}
}

export const tokenize=(text:string)=>{
    const out:Token[]=[];
    let i=0;
    while (i<text.length) {
        let code=text.codePointAt(i);
        if (code>0xffff) {
            const sur=String.fromCodePoint(code); 
            out.push(Token(sur,i,TOKEN_CJK_SURROGATE));
            i+=2;
            continue;
        } else if (code>=0x2000&&code<=0xffff) {
            const tt=(code>=2e80&&code<=0x2fff) //radical
                ||(code>=0x3041&&code<=0x9fff) //0xpunc
                || (code>=0xd400&&code<0xdfff)  //surrogates
                || (code>=0xe000&&code<0xfadf)? TOKEN_CJK_BMP:TOKEN_UNSEARCHABLE;

            out.push(Token(text[i],i,tt));
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
                out.push(Token(s.substring(prev,offset) , prev+i,TOKEN_UNSEARCHABLE));
            }
            while (s[offset]==' ') offset++;
            out.push([0,null,m1,i+offset,TOKEN_ROMANIZE]);
            prev=offset+m.length;
        });
        if (prev<s.length) out.push(Token(s.substring(prev)  ,prev+i,TOKEN_UNSEARCHABLE ));
        i=j;
    }
    return out;
}