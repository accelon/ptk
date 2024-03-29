
const CiteFormats=[/\(CBETA[ \d\.Q]*, ([A-Z]+)(\d+), no\. ([\da-z]+), p\. ([^\)]+)\)/g]; //引用複製格式
const RefTargetFormats=[
    /vol:(\d+);page:p(\d+), ([abcd])(\d+)/,  // with col and line
    /vol:(\d+);page:p(\d+)/,                 // page only
    /no:([\d\.]+)/,                          // sutra number
];
const CorNames={
    'Y':'yinshun',
    'T':'taisho',
    'TX':'taixu',
    'X':'wxzj',
    'N':'nanchuan',
}
export const parseVolNoPage=(str)=>{//CBETA 行首格式
    const m=str.match(/([A-Z]{1,2})(\d\d)n(\d\d\d\d[A-Za-z]?)_?p(\d+)([a-z])(\d*)/);
    if (m) {
        return {cor:m[1], vol:parseInt(m[2]), no:m[3], 
            page: parseInt(m[4]) , col: m[5].charCodeAt(0)-0x61, line:parseInt(m[6])}
    }
}
export const parseRefTarget=(str,reftype)=>{
    for (let i=0;i<RefTargetFormats.length;i++) {
        const m=str.match(RefTargetFormats[i]);
        if (m) {
            if (str.startsWith('vol')) {
                return reftype+m[1]+'p'+m[2]+ (m[3]?m[3]+m[4]:'');
            } else if (str.startsWith('no')) {
                return reftype+'n'+m[1];
            }
        }
    }
    return str;
}

export const convertCitationToTEIRef=(str)=>{
    const out=[];
    for (let i=0;i<CiteFormats.length;i++) {

        str=str.replace(CiteFormats[i],(m0, cor, vol, no, page)=>{
            const target='vol:'+vol+';page:p'+page;
            const text='^j#'+parseRefTarget(target,cor.toLowerCase());
            return '<ref text="'+text+'"/>'
        })
    }
    
    return str;
}