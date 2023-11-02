import App from './app.svelte';
import {landscape} from './appstore.js'

let portrait = window.matchMedia("(orientation: portrait)");
portrait.addEventListener("change", function(e) {
    // console.log(e.matches)
    landscape.set(!e.matches)
})

window.addEventListener("deviceorientation", ()=>{
    landscape.set(screen.availWidth>screen.availHeight)
}, true);
landscape.set(screen.availWidth>screen.availHeight);

const app = new App({target: document.body});
document.querySelector("#bootmessage").innerHTML='';
export default app;