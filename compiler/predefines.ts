/* todo , pb defined resetby=bk  */
export const predefines={
generic:
`^:ak<id=unique bracket=false reset=n>
^:bk<id=unique heading=text bracket=false reset=ck,dk,juan aligncaption=text>
^:ck<id=unique heading=text bracket=false>
^:dk<id=unique>
^:h<id=text>
^:end<id=text>
^:p<id=text>
^:b<bracket=false>
^:n<id=number>
^:pn<id=text>
^:ii<bracket=false>
^:quote
^:fig<bracket=false>
^:image
^:quotei
^:s<bracket=false>
^:folio<id=number>
^:m<id=text>
^:juan<id=number>
^:o<@=link>
^:j<@=link>
^:k<id=text>
^:wiki
^:png<id=text src=text>
^:svg<id=text>
^:uiicon<id=text>
^:jpg<src=text>
^:ad
^:bc
^:gatha
^:au
^:cut
^:paste
^:notranslation
^:ver<savelinepos=true>
^:f<id=text>
^:i<bracket=false @=text savelinepos=true>
^:sponsor<savelinepos=true>
^:https<bracket=false onclick=gourl>
^:fn<id=text>
^:t
^:x<id=text @=text bracket=false savelinepos=true>
^:y<id=unique bracket=false savelinepos=true>
^:connect<source=text target=text book=text>
^:ln<from=text to=text pin=text>
^:bb
^:audio
^:clip
^:img
^:sz
^:sc
^:missing
^:misalign
^:ff
^:part
^:vaggo
^:errorpunc
^:puncerror
^:error
^:doubt
^:tofix
^:add
^:pg
^:swap
^:move
^:baidu
^:note
^:miss
^:person
^:diff
^:corr`,
cbeta:
`^:ak<id=unique bracket=false>
^:bk<id=unique heading=text bracket=false reset=ck,p>
^:ck<id=unique heading=text bracket=false>
^:https<bracket=false onclick=gourl>
^:p<id=text>
^:f<id=text>
^:ver<savelinepos=true>
^:fn<id=number>
^:fm<id=text>
^:k<id=text>
^:j<@=link>
^:v
^:h
^:mc
^:l`,
cs:
`^:ak<id=unique bracket=false>
^:bk<id=unique heading=text bracket=false>
^:ck<id=unique heading=text bracket=false>
^:n<id=unique resetby=bk>
^:p<id=number>
^:ti<id=number heading=text bracket=false>
^:f<id=number>
^:h
^:sz
^:ckan
^:cksn
^:https<bracket=false onclick=gourl>
^:t`,
zidian:
`^:ak<id=unique bracket=false reset=ck>
^:bk<id=unique heading=text bracket=false reset=n>
^:ck<id=unique heading=text bracket=false>
^:f<id=number>
^:https<bracket=false onclick=gourl>
^:j<@=link>
^:o<@=link>
`,
subtitle:
`^:ak<id=unique bracket=false reset=n>
^:bk<id=unique heading=text bracket=false reset=ck>
^:ck<id=unique heading=text bracket=false>
^:mpeg<id=text savelinepos=true>
^:ts<id=range>
^:ver<savelinepos=true>`
}