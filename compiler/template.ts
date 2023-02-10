const nop=()=>{return []};
export const addTemplate=(name,template)=>{
    Templates[name]=template;
    if (!template.getFilters) template.getFilters=nop;
    if (!template.runFilter) template.runFilter=nop;
    if (!template.getCorrespondence) template.getCorrespondence=nop;
}

export const Templates={};
addTemplate('generic',{});