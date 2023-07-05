import {openPtk, writeChanged} from '../nodebundle.cjs';
export const dump=async (arg,arg2)=>{
    const ptk=await openPtk(arg);
    const lines=await ptk.loadAll();
    if (arg2) {
        writeChanged(arg2,lines.join('\n'),true)
    } else {
        console.log(lines)
    }
}