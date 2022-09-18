import {FirstPN} from './cs-first.ts';
export const firstParanumOf=chunkid=>{ //return first paranum given bkid
    return FirstPN[chunkid];
}
let BKPN_C=null;
const buildReverse=()=>{
    BKPN_C={};
    for (let c in FirstPN) {
        let bk='';
        const [m,pf,seg]=c.match(/([a-z]+)(\d+)/);
        const nseg=parseInt(seg);
        const pn=FirstPN[c];
        if (pf==='d') {
            if (nseg>0 && nseg<=13) bk='dn1'
            else if (nseg>=14&&nseg<=23) bk='dn2'
            else if (nseg>=24&&nseg<=34) bk='dn3';
        } else if (pf==='m') {
            if (nseg>0 && nseg<=50) bk='mn1'
            else if (nseg>=51&&nseg<=100) bk='mn2'
            else if (nseg>=101&&nseg<=152) bk='mn3';
        } else if (pf==='s') {
            if (nseg>0 && nseg<=11) bk='sn1'
            else if (nseg>=12&&nseg<=21) bk='sn2'
            else if (nseg>=22&&nseg<=34) bk='sn3';
            else if (nseg>=35&&nseg<=44) bk='sn4';
            else if (nseg>=45&&nseg<=56) bk='sn5';
        } else if (pf==='a') {
            bk='an'+seg;
        }
        if (!bk) throw "error chunk "+c
        if (!BKPN_C[bk]) BKPN_C[bk]={};
        BKPN_C[bk][pn]=c;
    }
}
export const bookParanumToChunk=(bkid,pn)=>{
    if (!BKPN_C) buildReverse();
    return (BKPN_C[bkid]||{})[pn];
}
