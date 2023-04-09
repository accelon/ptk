import {bookParanumToChunk,firstParanumOf} from "./cs-paranum.ts";
import { FirstPN } from "./cs-first.ts";
import { booksOf, pitakaOf,sortFilenames,getFilesOfBook,suttaOfBook} from "./sc-code.ts";
import {fromSeal, toSeal} from "./ebag.ts";
import {meta_cm} from "./cm.ts"
import {meta_subtitle} from "./subtitle.ts"
import {meta_vny} from "./vny.ts"
import {meta_cbeta} from "./cbeta.ts";
export {meta_cbeta,meta_vny,meta_subtitle,meta_cm}
export const meta_cs ={
    firstParanumOf,bookParanumToChunk,FirstPN,suttaOfBook
}
export const meta_sc={
    getFilesOfBook,pitakaOf,booksOf,sortFilenames
}
export const meta_ebag={
    fromSeal, toSeal
}
