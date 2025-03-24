import {getCaption,getHeading,caption,nearestChunk,getChunk,neighborChunks} from './chunk.ts'
import {tagInRange,fetchTag,getTagById,rangeOfElementId,innertext,findClosestTag,validId,nearestTag,alignable,
    rangeOfAddress,fetchAddress,fetchAddressExtra,tagCount,getTagFields,queryTagFields}from './address.ts'
function humanName(short:true,lang='zh'){
    let n= this.attributes[lang]||this.name;
    const at=n.indexOf('|');
    if (at==-1) return n;
    return short?n.slice(0,at):n.slice(at+1);
}    
export const enableTagFeature=(ptk)=>{
    ptk.innertext=innertext;    
    ptk.humanName=humanName;
    ptk.fetchAddress=fetchAddress;
    ptk.fetchAddressExtra=fetchAddressExtra;
    ptk.findClosestTag=findClosestTag;
    ptk.validId=validId;
    ptk.nearestTag=nearestTag;
    ptk.getTagFields=getTagFields;
    ptk.queryTagFields=queryTagFields;
    ptk.tagInRange=tagInRange;
    ptk.tagCount=tagCount;
    ptk.fetchTag=fetchTag;
    ptk.getTagById=getTagById;
    ptk.rangeOfAddress=rangeOfAddress;
    ptk.rangeOfElementId=rangeOfElementId;
    ptk.nearestChunk=nearestChunk;
    ptk.getChunk=getChunk;
    ptk.neighborChunks=neighborChunks;
    ptk.getCaption=getCaption;
    ptk.getHeading=getHeading;
    ptk.caption=caption;
    ptk.alignable=alignable;
}
