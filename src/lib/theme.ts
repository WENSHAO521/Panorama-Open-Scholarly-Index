// Light / dark choice (ThemeToggle), stored per browser.
//
// THEME_SCRIPT runs in <head> before first paint. It applies a stored choice
// and paints the page background straight away, so the browser never shows
// its own default canvas (black on a dark system) while the stylesheet is
// still loading. The inline background is removed once the page has loaded
// and the stylesheet's tokens take over.
export const THEME_KEY = 'posi-theme'
export const PAPER = { light: '#f6f7f7', dark: '#0e1415' } as const

export const THEME_SCRIPT = `(function(){var d=document.documentElement,t=null;try{t=localStorage.getItem('${THEME_KEY}')}catch(e){}
if(t!=='light'&&t!=='dark'){t=null}
var e=t||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
if(t){d.dataset.theme=t}
d.style.colorScheme=e;d.style.backgroundColor=e==='dark'?'${PAPER.dark}':'${PAPER.light}';
addEventListener('load',function(){d.style.backgroundColor='';if(!d.dataset.theme)d.style.colorScheme=''})})()`
