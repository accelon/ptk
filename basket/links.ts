export function addBacklinks(tagname, tptk, bk,targettagname, chunks, nlinks) {
    if (!tptk) tptk='*'; //any ptk
    if (!this.backlinks[tptk]) this.backlinks[tptk]={};
    if (!this.backlinks[tptk][this.name]) {
        this.backlinks[tptk][this.name]=[];
    }
    this.backlinks[tptk][this.name].push([tagname,bk,targettagname,chunks,nlinks]);
}
export function addForeignLinks(fptk){ //call by connect when other database is opened;
    for (let tptk in fptk.backlinks) {
        if (tptk == this.name || tptk==='*')  { //link to me
            for (let sptk in fptk.backlinks[tptk]) {
                this.foreignlinks[sptk]=fptk.backlinks[tptk][sptk];
            }
        }
    }
}