/*
import {diffChars} from 'diff';

export const similarSentence=(s1,s2)=>{
    let differ=0,equal=0;
    const d=diffChars(s1,s2);
    d.forEach(v=>{
        if (v.added || v.removed ) {
            differ+= v.value.replace(/[^\u3400-\u9fff]/g,'').length;
        } else {
            equal+=v.value.length ;
        }
    })
    const sim=  equal*2 / (s1.length+s2.length) ;
    return sim;
}
*/