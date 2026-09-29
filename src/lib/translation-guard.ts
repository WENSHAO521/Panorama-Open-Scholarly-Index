// Keeps the site working under browser page translation (Chrome, Edge,
// Google Translate and similar).
//
// A translator replaces the page's text nodes with its own <font> elements.
// React still holds the original text nodes, and when it later removes one
// or inserts next to one (search results arriving, a list changing, a menu
// closing) the DOM throws "The node to be removed is not a child of this
// node", which takes the whole page down to the error screen.
//
// This runs before React and makes those two DOM calls tolerate a node the
// translator has moved: removing it is skipped, and inserting before it
// appends instead. See https://github.com/facebook/react/issues/11538.
export const TRANSLATION_GUARD_SCRIPT = `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c.parentNode!==this)return c;return r.apply(this,arguments)};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this)return i.call(this,n,null);return i.apply(this,arguments)}})()`
