import { Column } from '../linebase/column.ts';
import {PagedGroup} from  '../paged/index.ts'

export const pagedGroupFromPtk=(ptk,pageds:PagedGroup)=>{
    pageds=pageds||new PagedGroup();
    const {sectiontypes,sectionnames,sectionstarts}=ptk.header;
    const pdg={};
    for (let i=1;i<sectiontypes.length;i++) {
        const stype=sectiontypes[i];
        if (stype!=='txt' && stype!=='tsv') continue;
        const from=sectionstarts[i]
        const to=sectionstarts[i+1];
        const content=ptk.slice(from,to);
        //conbine offtext and tsv into single file
        const name=sectionnames[i].replace('.off','').replace('.tsv','')
        if (!pdg[name]) pdg[name]=[];
        if (stype=='tsv') {
            const col=new Column();
            col.deserialize(content);
            const tsv=col.toTSV().replace(/\^p /g,'\n'); // encode in paged.dumpOffTsv
            pdg[name]=pdg[name].concat(tsv);
        } else {
            pdg[name]=pdg[name].concat(content);
        }
    }
    for (let name in pdg) {
        pageds.add(name,pdg[name].join('\n'));
    }
    return pageds
}