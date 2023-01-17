
export * from './sax.ts'
export * from './element.ts'
export * from './dom.ts'
export * from './tei.ts'
export * from './xmloff.ts'
export const parseXMLAttribute=(attrs:string)=>{
    const arr=attrs.split(/([a-z\:\_]+=".+?")/).filter(it=>!!it.trim());
    const out={};
    for (let i=0;i<arr.length;i++) {
        const [key,value]=arr[i].split(/="/);
        out[key]=value.slice(0,value.length-1);//remove tailing ""
    }
    return out;
}