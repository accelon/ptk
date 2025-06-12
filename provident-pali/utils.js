const reg_syllable=/([a-zBKGNCDFHJLPQRSTWXYZ](V[a-zKGNCDFHJLPQRSTWXYZ])*[AEIUOM]*)/g
export const breakSyllable=str=>{
    return str.split(reg_syllable);
}

export const doParts=(parts,charpat, onPart)=>{
    let out='';
    if (typeof parts=='string') parts=[parts]
    for (let j=0;j<parts.length;j++) {
        if (!parts[j]) continue;
        if (parts[j][0]=='<' || parts[j][0]=='^') {
            out+=parts[j];
            continue;
        }

        const units=parts[j].split(charpat);

        units.forEach(s=>{
            const m=s.match(charpat);
            if (!m) {
                out+=s;
            } else {
                out+=onPart(s);
            }
        })
    }
    return out;
}