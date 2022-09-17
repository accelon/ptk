import {enumBases} from './stem.js'
let pass=0,test=0;

let bases=enumBases('gtM');
~bases.indexOf('gt') ? pass++:0 ;test++

bases=enumBases('daNVDkEhIpI');
~bases.indexOf('daNVDk')&&~bases.indexOf('daNVDkEhI') ? pass++:0 ;test++

bases=enumBases('DnUsVmImVpI');
~bases.indexOf('DnUsVmIm')&&~bases.indexOf('DnU')&&~bases.indexOf('Dn') ? pass++:0 ;test++


bases=enumBases('dUkVKmsVs');
~bases.indexOf('dUkVK') ? pass++:0 ;test++
console.log(bases)

bases=enumBases('anUsAsItbVbYVc')
~bases.indexOf('anUsAsI')&&~bases.indexOf('anUsAsItbVb') ? pass++:0 ;test++

bases=enumBases('rOdnVtI')



console.log('pass',pass,'test',test)