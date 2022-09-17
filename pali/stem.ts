/* return a list of potential base form. */
import {alphabetically} from '../utils/sortedarray.js'
import {bsearch} from '../utils/bsearch.js'

const Stems_=`sUtVtM,vgVg,tIA,tI,pI,M,YVc,v,Mv,yEv`.split(/,/);
const Stems_verb=`nVtIyA,nVtAnM,nVtI,sI,sIA,mI,mIA,tIyA,eyVyAT,EyVyAm,eT,sVsAm,Imh,EyVyAT,EsVsnVtIA`.split(/,/);
const Stems_1=`EhI,EsU,En,sVmIm,sVmIM,sVs,AnI,Iy,ETA,tbVb,EyVY,EyVYU,mVhI,mVhA`.split(/,/);
const Stems_2=`A,O,E,I,U`.split(/,/);

const knownlist=``.split(/\r?\n/).sort(alphabetically)

export const enumBases=s=>{
	const out=[];
	let p=s,verb=false;
	const at=bsearch(knownlist,s);
	if (at>-1) return s;

	if (s[1]=='V' && s[0].toLowerCase()===s[2].toLowerCase()) {
		s=s.slice(2);
	}
	if (s.length<3) return out;


	if (s.endsWith('V') ) {
		p=s.slice(0,s.length-1)
		out.push(p);
	}

	for (let i=0;i<Stems_verb.length;i++) {
		if (p.endsWith(Stems_verb[i])) {
			out.push(p.slice(0,p.length-Stems_verb[i].length)+'tI');
			verb=true;
			break;
		}
	}

	if (!verb) for (let i=0;i<Stems_.length;i++) {
		if (p.endsWith(Stems_[i])) {
			p=p.slice(0,p.length-Stems_[i].length);
			if (p.endsWith('V') ) p=p.slice(0,p.length-1);
			out.push(p);
			break;
		}
	}


	if (!verb) for (let i=0;i<Stems_1.length;i++) {
		if (p.endsWith(Stems_1[i])) {
			out.push(p.slice(0,p.length-Stems_1[i].length));
			p=p.slice(0,p.length-Stems_1[i].length);
			break;
		}
	}

	if (!verb) for (let i=0;i<Stems_2.length;i++) {
		if (p.endsWith(Stems_2[i])) out.push(p.slice(0,p.length-Stems_2[i].length));
	}


	if (p.endsWith('m')||p.endsWith('y')) out.push(p.slice(0,p.length-1))
	if (p.endsWith('sI')||p.endsWith('mI')) out.push(p.slice(0,p.length-2)+'tI')


	return out;
}