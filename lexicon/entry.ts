import { splitUTF32Char } from "../utils"

export const guessEntry=(sentence:string,values:Array<String>)=>{
    for (let i=0;i<values.length;i++) {
        if (sentence.slice(0,values[i].length)==values[i]) {
            return values[i]
        }
    }
    const chars=splitUTF32Char(sentence);
    return chars[0];
}