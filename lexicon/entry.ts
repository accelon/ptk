import {splitUTF32Char} from "../utils"
import {StringArray} from '../utils/stringarray'
export const guessEntry=(sentence:string,values:Array<String>)=>{
    const at=sentence.indexOf('^');
    let textbefore='';
    if (~at) {
        textbefore=sentence.slice(0,at);
        sentence=sentence.slice(at+1);
    }
    //  如是^我聞 如是我^聞 如^是我聞 
    //  點任何一字都可以找到
    for (let j=0;j<=textbefore.length;j++) {
        for (let i=0;i<values.length;i++) {
            const tf= (textbefore.slice( textbefore.length-j) +sentence).slice(0,values[i].length);
            if (tf==values[i] && j<values[i].length) {//必須是在詞之中
                return values[i]
            }
        }
    }
    const chars=splitUTF32Char(sentence);
    return chars[0];
}

