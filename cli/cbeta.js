import PTK from '../nodebundle.cjs';
const  { meta_cbeta } = PTK; 

export const cbeta=arg=>{
    if (!arg) {
        console.log('cbeta address format, e.g T50n0026_p0220a03')
        console.log(meta_cbeta)
        return;
    }
    console.log(arg)
}