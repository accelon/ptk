import {Field} from './basefield.ts';
import {StringArray,LEMMA_DELIMITER} from '../utils/stringarray.ts';
import {parseAddress,parseAction,makeElementId} from '../basket/address.ts';
import {packInt2d} from  "../utils/packintarray.ts"
import {unpackInt2d} from  "../utils/unpackintarray.ts"
import {alphabetically0} from '../utils/sortedarray.ts'
import {VError} from './error.ts';
import {bsearch} from "../utils/bsearch.ts";
/* link to foriegn key */
export class LinkField extends Field {
	constructor(name:string,def:Map){
		super(name,def);
        this.invertlinks={};
		this.type='link';
        this.count=0;
	}
	validate(value:string,line:number){
		const addr=parseAddress(value);
        const act=parseAction(addr.action);
        if (!this.invertlinks[addr.ptkname]) this.invertlinks[addr.ptkname]={};
        let invertlinks=this.invertlinks[addr.ptkname];
        if (act.length!==2) {
            return [VError.InvalidLinkAddress,addr.action];
            //throw "link must have 2 level addressing ";
        }
        for (let i=0;i<act.length;i++) {
            let [ele,id]=act[i];
            if (i==0 && !act[i][1]) {
                ele='bk';
                id=act[i][0];
            }
            const eleid=makeElementId(ele,id);
            if (i==act.length-1) { //leaf
                if (!invertlinks[ele]) invertlinks[ele]={};
                if (!invertlinks[ele][id]) invertlinks[ele][id]=[];
                invertlinks[ele][id].push(this.count);
                this.count++
            } else {
                if (!invertlinks[eleid]) {
                    invertlinks[eleid]={};
                }
                invertlinks=invertlinks[eleid];
            }
        }
		return [0,value];
	}	
    serializeLinks(bklinks){ 
        //assuming bk.ck or bk.n , ak.n
        //反連結只能快速知道某個ck or n 有沒有被連
        //精確的定位必須讀取原連結 才會取得
        const out=[];
        for (let bk in bklinks) {
            const links=bklinks[bk];
            for (let targettag in links) {
                const arr=[];
                for (let id in links[targettag]) {
                    arr.push([id,links[targettag][id]]);
                }

                arr.sort(alphabetically0);
                const chunks=arr.map(it=>it[0]);
                const idxarr=arr.map(it=>it[1]); 
                out.push(bk);
                out.push(targettag);
                out.push(chunks.join(LEMMA_DELIMITER));
                out.push(packInt2d(idxarr));    
            }
        }
        return out;
    }
    serialize(){
        const attrs={};
        //首先寫入原始連結,之後是反連結
        let section=[].concat(this.values); //first link is link count of each target ptk
        for (let ptkname in this.invertlinks) { 
            const out=this.serializeLinks(this.invertlinks[ptkname]);
            attrs[ptkname]=out.length; //每個資料庫的連結總數
            section=section.concat(out);
        }
        attrs['*']=this.values.length;//連結總數
        section.push(JSON.stringify(attrs)); //put at the end
        return section;
    }
    deserialize(section,ptk){
        const attrs=JSON.parse(section.pop());
        const valuelen=attrs['*'];
        let offset=0;
        for (let db in attrs) {
            if (db=='*') continue;
            const datalen=attrs[db];
            while (offset<datalen) {
                const bk=section[valuelen+offset];
                const targettagname=section[valuelen+offset+1];
                const chunks=new StringArray(section[valuelen+offset+2],{sep:LEMMA_DELIMITER});
                const idxarr=unpackInt2d(section[valuelen+offset+3]);
                ptk.addBacklinks(this.name, db, bk, targettagname, chunks,idxarr);
                offset+=4;
            }
        }        
        // the raw @ values
        const values=section.slice(0,valuelen);
        section.length=0;
        return values;
    }
}