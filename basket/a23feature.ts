/* accelon 23 backend */
import {columnField,inlineNote,rowOf,scanColumnFields,searchColumnField} from './columns.ts';
import {parseQuery,scanText,scoreLine,hitsOfLine} from '../fts/query.ts';
import {footNoteAddress,footNoteByAddress,footNoteInTSV} from './footnote.ts';
import {foreignLinksAtTag,getParallelBook,getParallelLine,enumParallelsPtk} from './parallel.ts';
import {addBacklinks, addForeignLinks } from './links.ts';
import {getCaption,caption,nearestChunk,getChunk,neighborChunks} from './chunk.ts'
import {tagInRange,fetchTag,rangeOfElementId,innertext,findClosestTag,validId,nearestTag,
    rangeOfAddress,fetchAddress,fetchAddressExtra}from './address.ts'
import { enableFeatureFTS} from './postings.ts';
import {enableFeatureTOC} from './toc.ts'

function humanName(short:true,lang='zh'){
    let n= this.attributes[lang]||this.name;
    const at=n.indexOf('|');
    if (at==-1) return n;
    return short?n.slice(0,at):n.slice(at+1);
}
export const enableFeature=(ptk:any,feature:string)=>{
    if (feature=="abkck") {
        //if (ptk.defines.ak)
    } else if (feature=='toc') {
        enableFeatureTOC(ptk)
    } else if (feature=='fts') {
        enableFeatureFTS(ptk)
    }
}
export const enableFeatures=(ptk:any,features:Array<string>|string)=>{
    if (!Array.isArray(features)) features=[features];
    features.forEach(f=>enableFeature(ptk,f))
}
export const enableAccelon23Features=(ptk:any)=>{
    //check fields
    ptk.humanName=humanName;
    ptk.fetchAddress=fetchAddress;
    ptk.fetchAddressExtra=fetchAddressExtra;
    ptk.findClosestTag=findClosestTag;
    ptk.validId=validId;
    ptk.nearestTag=nearestTag;
    ptk.tagInRange=tagInRange;
    ptk.fetchTag=fetchTag;
    ptk.rangeOfAddress=rangeOfAddress;
    ptk.rangeOfElementId=rangeOfElementId;
    ptk.nearestChunk=nearestChunk;
    ptk.getChunk=getChunk;
    ptk.neighborChunks=neighborChunks;
    ptk.getCaption=getCaption;
    ptk.caption=caption;
    ptk.innertext=innertext;
    ptk.scanColumnFields=scanColumnFields;
    ptk.searchColumnField=searchColumnField;
    ptk.scanText=scanText;
    ptk.parseQuery=parseQuery;
    ptk.scoreLine=scoreLine;

    ptk.scanCache={};
    ptk.queryCache={};
    ptk.columnField=columnField;
    ptk.inlineNote=inlineNote;
    ptk.footNoteAddress=footNoteAddress;
    ptk.footNoteByAddress=footNoteByAddress;
    ptk.footNoteInTSV=footNoteInTSV;
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
    ptk.hitsOfLine=hitsOfLine;

   
    ptk.parallels={}; //parallels showing flag, ptkname:string, onoff:boolean

}
