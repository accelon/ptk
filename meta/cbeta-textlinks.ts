
const CiteFormats=[/\(CBETA[ \d\.Q]*, ([A-Z]+)(\d+), no\. (\d+), p\. ([^\)]+)/]; //引用複製格式
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


export const parseRefTarget=(str,reftype)=>{
    for (let i=0;i<RefTargetFormats.length;i++) {
        const m=str.match(RefTargetFormats[i]);
        if (m) {
            if (m[0].startsWith('no')) console.log(m);
            break;
        }
    }
    return str;
}

export const convertCitationToTEIRef=(str)=>{
    const out=[];
    for (let i=0;i<CiteFormats.length;i++) {
        str=str.replace(CiteFormats[i],(m0, cor, vol, no, page)=>{
            return '<ref type="'+CorNames[cor]+'" target="vol:'+vol+';page:p'+page+'"/>'
        })
    }
    
    return str;
}