// import { Column } from '../linebase/column.ts';
// import {PagedGroup} from  '../paged/index.ts'
import {Compiler,makeLineBaser} from '../compiler/index.ts';
import {makeInMemoryPtk} from '../basket/ptkfile.ts'

/*  discard, 只能從 pgd 轉 ptk ，先不考慮從 ptk 轉pgd
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
            const tsv=col.toTSV().replace(/\^p /g,'\n'); 
            pdg[name]=pdg[name].concat(tsv);
        } else {
            //convert ck back to tab, see dumpOffTsv
            const newcontent=content.map(it=>it.replace(/\^ck\d+ /g,'\t'));
            pdg[name]=pdg[name].concat(newcontent);
        }
    }
    for (let name in pdg) {
        pageds.add(name,pdg[name].join('\n'));
    }
    return pageds
}
*/
export const PtkFromPagedGroup=async(sources,img=false):Promise<string|Uint8Array>=>{
    const compiler=new Compiler;
    for (let i=0;i<sources.length;i++) {
        const fn=sources[i].name.replace(/\.[^.]*$/g,'');
        const header=sources[i].header;
        if (fn=='0') continue;
        let prolog='';
        if (~sources[i].name.indexOf(".tsv")) {
            prolog="^:<name="+fn+" preload=true>\tdef\n"
        } else {
            if (!header.id) header.id=fn;
            let title='';
            const H=Object.assign({},header)
            if (header.title) {
                title=('《'+ header.title +'》');
                delete H.title;//shouldn't delete header.title
            }
            const bkattrs=JSON.stringify(H);
            prolog='^ak#'+header.id+'^bk'+bkattrs+title+'\n';
        }
        sources[i].text=prolog+sources[i].text;
    }
    const lbaser=await makeLineBaser(sources,compiler);
    if (img) {
        const ptkimage=makeInMemoryPtk(lbaser);
        return ptkimage;
    } else {
        return lbaser.asString();
    }
}