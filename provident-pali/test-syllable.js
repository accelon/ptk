let pass=0,test=0;
console.clear()

import {syllablify} from './syllable.js'

syllablify('aDIgmnIAyAnI').join('-')==='a-DI-g-m-nIA-yA-nI'?pass++:0;test++;
syllablify('aDIpVpAyEn').join('-')==='a-DI-pVpA-yE-n'?pass++:0;test++;
syllablify('uAhYVYEyVy').join('-')==='uA-h-YVYE-yVy'?pass++:0;test++;
syllablify('vIsYVYUtVtA').join('-')==='vI-s-YVYU-tVtA'?pass++:0;test++;
syllablify('vIvrIMsU').join('-')==='vI-v-rIM-sU'?pass++:0;test++;
console.log('pass',pass,'test',test)