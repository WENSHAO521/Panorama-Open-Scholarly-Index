// Stored light/dark choice (ThemeToggle). THEME_SCRIPT runs in <head> so the
// choice applies before first paint.
export const THEME_KEY = 'posi-theme'
export const THEME_SCRIPT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`
