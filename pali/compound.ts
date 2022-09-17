export const compoundSimilarity=(compound,parts,debug=false)=>{
	let score=0, prev=-1, partlen=0;
	debug&&console.log(compound,parts)
	for (let i=0;i<parts.length;i++) {
		let p=parts[i];
		if (debug && prev+2>compound.length) {//enough
			parts.length=i;
			break;
		}
		const at1=compound.indexOf(p,prev);
		const at2=compound.indexOf(p.slice(0,p.length-1),prev);
		const at3=compound.indexOf(p.slice(1),prev);
		if (debug) console.log(p,at1,at2,at3,prev)

		partlen+=p.length;
		if (at1>-1 && at1>>prev && at1<=at2) {
			score+=1;
			prev=at1+p.length-1;
			debug &&console.log('+1',p,at1)
		} else if (at2>-1 &&at2>=prev)  {
			prev=at2+p.length-1;
			score+=1;
			debug &&console.log('+1',p)
		} else if (at2>-1 &&at3>=prev) {
			prev=at3+p.length-1;
			score+=1;
			debug &&console.log('+1',p)
		}
	}

	let partlenratio =partlen/compound.length;
	if (partlenratio>1) partlenratio=1; //parts 長度總長必須足夠接近compound 長
	const sim=(score/parts.length) * partlenratio;
	debug&&console.log(compound,'sim',sim,parts,score,partlen,compound.length)

	return {sim, partcount:parts.length};
}