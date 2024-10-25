/* accelon 23 backend */
import {columnField,inlineNote,rowOf,scanColumnFields,searchColumnField} from './columns.ts';

import {footNoteAddress,footNoteByAddress,footNoteInTSV} from './footnote.ts';
import {foreignLinksAtTag,getParallelBook,getParallelLine,enumParallelsPtk} from './parallel.ts';
import {addBacklinks, addForeignLinks } from './links.ts';
import {enableBacklinkFeature} from './backlinks.ts'
import {enableFTSFeature} from './postings.ts';
import {enableTOCFeature} from './toc.ts'
import {enableTagFeature} from './tagfeature.ts'
import { tagAtAction } from './address.ts';

export const enableFeature=(ptk:any,feature:string)=>{
    if (feature=="tag") {
        enableTagFeature(ptk);
    } else if (feature=='toc') {
        enableTOCFeature(ptk)
    } else if (feature=='fts') {
        enableFTSFeature(ptk)
    } else if (feature=='backlink') {
        enableBacklinkFeature(ptk)
    } else if (feature=='footnote') {
        enableFootnoteFeature(ptk)
    }
}
export const enableFeatures=(ptk:any,features:Array<string>|string)=>{
    if (!Array.isArray(features)) features=[features];
    features.forEach(f=>enableFeature(ptk,f))
}
export const enableFootnoteFeature=(ptk:any)=>{
    ptk.inlineNote=inlineNote;
    ptk.footNoteAddress=footNoteAddress;
    ptk.footNoteByAddress=footNoteByAddress;
    ptk.footNoteInTSV=footNoteInTSV;
}
export const enableAccelon23Features=(ptk:any)=>{
    //check fields
    enableTagFeature(ptk);
    enableTOCFeature(ptk);
    enableFTSFeature(ptk);
    enableBacklinkFeature(ptk);
    enableFootnoteFeature(ptk);
    ptk.scanColumnFields=scanColumnFields;
    ptk.searchColumnField=searchColumnField;

    ptk.tagAtAction=tagAtAction;

    ptk.scanCache={};
    ptk.queryCache={};
    ptk.columnField=columnField;
    ptk.foreignLinksAtTag=foreignLinksAtTag;
    ptk.getParallelBook=getParallelBook;
    ptk.getParallelLine=getParallelLine;
    ptk.enumParallelsPtk=enumParallelsPtk;
    ptk.taggedLines={};
    ptk.foreignlinks={}; 
    ptk.addForeignLinks=addForeignLinks;
    ptk.addBacklinks=addBacklinks;

    ptk.backlinks={};
    ptk.rowOf=rowOf;
  
    ptk.parallels={}; //parallels showing flag, ptkname:string, onoff:boolean
}
