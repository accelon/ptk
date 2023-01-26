const nop=()=>{return []};
export const addTemplate=(name,template)=>{
    Templates[name]=template;
    if (!template.getFilters) template.getFilters=nop;
    if (!template.runFilter) template.runFilter=nop;
    if (!template.getParallels) template.getParallels=nop;
}

export const Templates={};
addTemplate('generic',{});