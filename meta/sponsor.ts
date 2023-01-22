const sponsors=[
    '釋常明','甯耀南','陳信良','葛介正','王志攀'
]

export const getSponsor=(ptk,line)=>{
    const sp=ptk.taggedLines.sponsor || sponsors;
    return sp[ Math.floor(Math.random()* sp.length) ]||'';
}
