import {Field} from './basefield.ts'
import {packIntDelta2d,unpackIntDelta2d,alphabetically, LEMMA_DELIMITER} from '../utils/index.ts'
//must by sorted, one per tsv, for categorization
export class GroupField extends Field { //multiline 
	constructor(name:string,def:Map){
		super(name,def);
		this.type=def.type||'range';
        this.ranges={};
	}
	validate(value:string,line:number){
		//convert items to key index, try foreign key first, 
		if (!value) { //empty value, validate pass if optional
			return [this.optional?0:VError.Mandatory,[]];
		}
		if (!this.ranges[value]) this.ranges[value]=[];
		this.ranges[value].push(line);
		if (isNaN(value)) {
			throw "group index should be numeric"
		}
		return [0,parseInt(value)]
	}
    serialize(out:[string]){
		const keys=Object.keys(this.ranges);
		keys.sort(alphabetically);
		out.push(keys.join(LEMMA_DELIMITER));
		const delta2d=[];
		for (let i=0;i<keys.length;i++) {
			delta2d.push( this.ranges[keys[i]]);
		}
        out.push(packIntDelta2d(delta2d));
		out.push()
    }
    deserialize(section:[string]){
        const keys=(section.shift()||'').split(LEMMA_DELIMITER);
		const arr=unpackIntDelta2d(section.shift());
		for (let i=0;i<keys.length;i++) {
			this.ranges[keys[i]]=arr[i];
		}
    }
}