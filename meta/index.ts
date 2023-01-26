import {bookParanumToChunk,firstParanumOf} from "./cs-paranum.ts";
import { FirstPN } from "./cs-first.ts";
import { booksOf, pitakaOf,sortFilenames,getFilesOfBook,suttaOfBook} from "./sc-code.ts";
import {fromSeal, toSeal} from "./ebag.ts";
export * as meta_cm from "./cm.ts"
export * as meta_vny from "./vny.ts"

export const meta_cs ={
    firstParanumOf,bookParanumToChunk,FirstPN,suttaOfBook
}
export const meta_sc={
    getFilesOfBook,pitakaOf,booksOf,sortFilenames
}

export const meta_ebag={
    fromSeal, toSeal
}
