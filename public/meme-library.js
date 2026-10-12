import { EXPRESSIONS } from './scoring.js';
export const DEFAULT_MEMES = ['smile','surprise','pout'];
export const MEME_ICONS = { smile:'😁',surprise:'😮',pout:'😗',wink:'😉',laugh:'😆',scowl:'😠' };
const KEY = 'meme-mirror-round-memes-v1';
export function validSelection(ids) {
  return Array.isArray(ids) && ids.length===3 && new Set(ids).size===3 && ids.every(id=>EXPRESSIONS.some(e=>e.id===id));
}
export function readSelection() {
  try { const ids=JSON.parse(localStorage.getItem(KEY));return validSelection(ids)?ids:[...DEFAULT_MEMES]; } catch { return [...DEFAULT_MEMES]; }
}
export function saveSelection(ids) {
  if (!validSelection(ids)) throw new Error('Choose three different memes.');
  localStorage.setItem(KEY,JSON.stringify(ids));
}
export function selectedProfiles(ids, references) {
  if (!validSelection(ids)) throw new Error('Choose three different memes.');
  return ids.map(id=>{const base=EXPRESSIONS.find(e=>e.id===id);return {...base,...references[id]};});
}
