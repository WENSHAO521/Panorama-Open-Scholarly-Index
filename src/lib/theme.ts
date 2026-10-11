// Light / Dark / System preference. Stored in this browser only
// (localStorage); nothing is sent anywhere. "system" means no data-theme
// attribute, so the OS setting decides (see styles/posi-tokens.css).
export type ThemeChoice = 'system' | 'light' | 'dark'
export const THEME_KEY = 'posi-theme'

/** Runs in <head> before first paint so a pinned theme never flashes. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
