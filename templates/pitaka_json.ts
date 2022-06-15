
export default (ptkName:string, template:string='simple')=>`{
    "name":"${ptkName}",
    "created":"${new Date()}",
    "template":"${template}",
    "files":"file1.off"
}`