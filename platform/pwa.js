
export function getPWADisplayMode() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (document.referrer.startsWith('android-app://')) {
      return 'twa';
    } else if (navigator.standalone || isStandalone) {
      return 'standalone';
    }
    return 'browser';
}
export function registerServiceWorker(swfn="./sw.js"){

  const localhost=isLocalhost();
  if ("serviceWorker" in navigator && (localhost||p=='https:') ) {
    navigator.serviceWorker.register(swfn);
  }
}
export function isLocalhost(){
  const p=document.location.protocol;
  const h=document.location.hostname;
  return p=='http:' && (h=='127.0.0.1' || h=='localhost');
}
