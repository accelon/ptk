/*
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
            const tt=(code>=0x2e80&&code<=0x2fff) //radical
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

*/

/**
 * tokenize：参照Go版本重写，状态机分词，无正则，行为对齐Go
 * @param text 输入字符串 (JS UTF‑16)
 */

// AI version , identical with go

export enum TokenType {
    UNSEARCHABLE = 0x1,
    OFFTAG = 0x3,
    SEARCHABLE = 0x10,
    ROMANIZE = 0x20,
    MYANMAR = 0x21,
    CJK = 0x30,
    CJK_BMP = 0x31,
    CJK_SURROGATE = 0x32
}

export interface IToken {
    text: string;
    choff: number; // UTF‑16 code unit offset
    tkoff: number; // token offset (only searchable tokens increment)
    type: TokenType;
    line: number;
}

export function Token(text: string, choff: number, tkoff: number, type: TokenType, line: number = 0): IToken {
    return { text, choff, tkoff, type, line };
}

// 判断是否罗马字单词字符 [a‑zA‑Z0‑9] 
function isWordChar(c: string): boolean {
    const cp = c.charCodeAt(0);
    return (cp >= 0x41 && cp <= 0x5A) || (cp >= 0x61 && cp <= 0x7A) || (cp >= 0x30 && cp <= 0x39);
}

export function tokenize(text: string): IToken[] {
    const out: IToken[] = [];
    if (typeof text !== "string") return [];

    let pos = 0; // index over JS string (UTF‑16 code unit index)
    const len = text.length;
    let tkoff = 0;

    while (pos < len) {
        const cp = text.codePointAt(pos)!;

        // 1. 码点 > 0xFFFF：代理对 CJK_SURROGATE，占2个UTF‑16单元
        if (cp > 0xFFFF) {
            const s = String.fromCodePoint(cp);
            out.push(Token(s, pos, tkoff, TokenType.CJK_SURROGATE));
            tkoff += 1;
            pos += 2;
            continue;
        }

        // 2. BMP 0x2000 ~ 0xFFFF
        if (cp >= 0x2000 && cp <= 0xFFFF) {
            const isCJK =
                (cp >= 0x2E80 && cp <= 0x2FFF) ||   // CJK radicals
                (cp >= 0x3041 && cp <= 0x9FFF) ||   // cjk / kana / hangul
                (cp >= 0xD400 && cp < 0xDFFF) ||    // surrogate range
                (cp >= 0xE000 && cp < 0xFADF);      // private‑use etc

            const tt = isCJK ? TokenType.CJK_BMP : TokenType.UNSEARCHABLE;
            out.push(Token(text[pos], pos, tkoff, tt));
            if (tt !== TokenType.UNSEARCHABLE) {
                tkoff += 1;
            }
            pos += 1;
            continue;
        }

        // 3. cp < 0x2000：连续取出一整块
        const blockStartPos = pos;
        while (pos < len && (text.codePointAt(pos)! < 0x2000)) {
            pos++;
        }
        const blockStr = text.slice(blockStartPos, pos);
        const blockLen = blockStr.length;
        let i = 0;
        let prev = 0;

        // 在 blockStr 内部状态机切分 word / non‑word
        while (i < blockLen) {
            // skip non‑word
            while (i < blockLen && !isWordChar(blockStr[i])) {
                i++;
            }
            if (i >= blockLen) break;

            // emit non‑word prefix as UNSEARCHABLE
            if (i > prev) {
                out.push(Token(
                    blockStr.slice(prev, i),
                    blockStartPos + prev,
                    tkoff,
                    TokenType.UNSEARCHABLE
                ));
            }

            // consume word
            const wordStart = i;
            while (i < blockLen && isWordChar(blockStr[i])) {
                i++;
            }
            out.push(Token(
                blockStr.slice(wordStart, i),
                blockStartPos + wordStart,
                tkoff,
                TokenType.ROMANIZE
            ));
            tkoff += 1;
            prev = i;
        }

        // trailing non‑word tail
        if (prev < blockLen) {
            out.push(Token(
                blockStr.slice(prev),
                blockStartPos + prev,
                tkoff,
                TokenType.UNSEARCHABLE
            ));
        }
    }

    return out;
}

