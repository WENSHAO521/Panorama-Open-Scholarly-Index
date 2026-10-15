// Light / Dark choice (the sun/moon switch). Stored in this browser only
// (localStorage); nothing is sent anywhere. With nothing stored the page is
// light: the operating system's setting is not followed (see styles/posi-tokens.css).
export type ThemeChoice = 'light' | 'dark'
export const THEME_KEY = 'posi-theme'

/** Runs in <head> before first paint so a pinned theme never flashes. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
