import {fromIAST,toIAST,toIASTWord,RO_CHARS,toIASTOffText} from "./iast.js"
export * from './iast.js'
export * from "./ipa.js"
export * from "./order.js"
export * from "./lexification.js"
export * from "./formulation.js"
export * from "./syllable.js"
export * from "./lexeme.js"

import {toIndicXML,toIndic,fromDevanagari,fromDevanagariWord,enumTransliteration,DEVAPAT,DEVAPAT_G} from "./indic.js"
import { doParts ,breakSyllable } from "./utils.js"
export const xml2indic=(str,script='')=>{
    if (!script) return str;
    if (script==='iast'|| script==='romn' || script==='ro') return toIAST(str,{format:'xml'});
    else return toIndicXML(str,script)
}
export const offtext2indic=(str,script='')=>{
    if (!script) return str;
    if (script==='iast'|| script==='romn' || script==='ro') return toIAST(str);
    else return toIndic(str,script)

}
export const deva2IAST=(buf,onError)=>{ //for cst4
    buf=buf.replace(/\u200d/g,'');    
    return buf.replace(DEVAPAT_G,(m,deva)=>{
        const prov=fromDevanagariWord(deva);
        const num=parseInt(prov);
        if (!isNaN(num) && num.toString()==prov) return prov;
        let iast=toIASTWord(prov);
        if (onError&&iast.indexOf('??') > -1) {
            onError(deva,prov);
        }
        return iast;
    })


    /*
    buf=buf.replace(/\u200d/g,''); //remove zero width joiner
    let out=doParts(buf,DEVAPAT,(deva)=>{
        const prov=fromDevanagariWord(deva);
        const num=parseInt(prov);
        if (!isNaN(num) && num.toString()==prov) return prov;
        let iast=toIASTWord(prov);
        if (onError&&iast.indexOf('??') > -1) {
            onError(deva,prov);
        }
        return iast;
    });

    return out;
    */
}

export const LEXEME_REG_G=/([a-zA-Z]+[\dA-Za-z]*[a-zA-Z]+)/g;
export const LEX_REG_G=/([a-zA-Z]+\d+[\dA-Za-z]+)/g;
export const PALIWORD_REG_G=/([a-zA-Z]+)/g;
export const isLex=w=>!!w.match(/[a-zA-Z]\d[a-zA-Z]/);

//export fromIAST,toIAST,toIASTOffText,fromDevanagari,enumTransliteration,breakSyllable,RO_CHARS;