import {bookParanumToChunk,firstParanumOf} from "./cs-paranum.ts";
import { FirstPN } from "./cs-first.ts";
import { booksOf, pitakaOf,sortFilenames,getFilesOfBook} from "./sc-code.ts";

export const suttaOfBook=bkid=>{
    const out=[];
    if (bkid==='dn')      for (let i=1;i<=34;i++) out.push('d'+i);
    else if (bkid==='dn1')      for (let i=1;i<=13;i++) out.push('d'+i);
    else if (bkid==='dn2')      for (let i=14;i<=23;i++) out.push('d'+i);
    else if (bkid==='dn3')      for (let i=24;i<=34;i++) out.push('d'+i);
    else if (bkid==='mn') for (let i=1;i<=152;i++) out.push('m'+i);
    else if (bkid==='mn1') for (let i=1;i<=50;i++) out.push('m'+i);
    else if (bkid==='mn2') for (let i=51;i<=100;i++) out.push('m'+i);
    else if (bkid==='mn3') for (let i=101;i<=152;i++) out.push('m'+i);
    else if (bkid==='sn') for (let i=1;i<=56;i++) out.push('s'+i);
    else if (bkid==='sn1') for (let i=1;i<=11;i++) out.push('s'+i);
    else if (bkid==='sn2') for (let i=12;i<=21;i++) out.push('s'+i);
    else if (bkid==='sn3') for (let i=22;i<=34;i++) out.push('s'+i);
    else if (bkid==='sn4') for (let i=35;i<=44;i++) out.push('s'+i);
    else if (bkid==='sn5') for (let i=45;i<=56;i++) out.push('s'+i);
    else if (bkid==='an') for (let i=1;i<=11;i++) out.push('a'+i);
    else if (bkid.match(/an\d/)) out.push('a'+bkid.substr(2));
    return out;
}

export const meta_cs ={
    firstParanumOf,bookParanumToChunk,FirstPN,suttaOfBook
}
export const meta_sc={
    getFilesOfBook,pitakaOf,booksOf,sortFilenames
}
