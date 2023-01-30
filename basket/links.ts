export function addBacklinks(tagname, tptk, bk,targettagname, chunks, nlinks) {
    if (!tptk) tptk=this.name;
    if (!this.backlinks[tptk]) this.backlinks[tptk]={};
    if (!this.backlinks[tptk][this.name]) {
        this.backlinks[tptk][this.name]=[];
    }
    this.backlinks[tptk][this.name].push([tagname,bk,targettagname,chunks,nlinks]);
}
export function addForeignLinks(fptk){ //call by connect when other database is opened;
    for (let tptk in fptk.backlinks) {
        if (tptk == this.name) { //link to me
            for (let sptk in fptk.backlinks[this.name]) {
                this.foreignlinks[sptk]=fptk.backlinks[this.name][sptk];
            }
        }
    }
}
export function getParallelLine(masterptk,line){
    return [true,0];
}