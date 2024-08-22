import {TableOfContent,buildTocTag} from '../compiler/toc.ts';
import {sourceType} from '../compiler/index.ts'

export const enableFeatureTOC=(ptk:any)=>{
    //build chunk toc
    const section=ptk.getSection("toc");
    if (ptk.attributes.toctag&&section&&section.length>1) {       
		const firstline=section.shift();
		const {name}=sourceType(firstline);
        if (!ptk.tocs) ptk.tocs={}
        ptk.tocs[ name|| '*'] = new TableOfContent(section,name);
        const toctags=ptk.attributes.toctag.split(',');
        buildTocTag.call(ptk,toctags);
    }
}

