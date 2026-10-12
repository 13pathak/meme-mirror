import { EXPRESSIONS, FEATURES, validateReference } from './scoring.js';
const KEY = 'meme-mirror-operator-references-v1';
export const MODEL = 'face_landmarker/float16/1 + tasks-vision/0.10.21';
export function readReferences() {
  try { return validatePack(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return {}; }
}
export function validatePack(pack) {
  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error('Invalid reference pack.');
  const clean = {};
  for (const [key, ref] of Object.entries(pack)) {
    const expression = EXPRESSIONS.find(e => e.id === key);
    if (!expression || ref.model !== MODEL || typeof ref.caption !== 'string' || ref.caption.length > 100 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(ref.image) || ref.image.length > 2200000) throw new Error('Invalid or incompatible reference pack. Import photos again with this model.');
    if (Object.keys(FEATURES).some(k => !Number.isFinite(ref.target?.[k]) || ref.target[k] < 0 || ref.target[k] > 1) || validateReference(ref.target, expression)) throw new Error('Invalid expression target in reference pack.');
    clean[key] = { model: MODEL, caption: ref.caption, image: ref.image, target: Object.fromEntries(Object.keys(FEATURES).map(k => [k, ref.target[k]])) };
  }
  return clean;
}
export function saveReferences(refs) { localStorage.setItem(KEY, JSON.stringify(validatePack(refs))); }
export async function preparePhoto(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP photo.');
  if (file.size > 12000000) throw new Error('Please use a photo smaller than 12 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .88));
  return { blob, image: canvas.toDataURL('image/jpeg', .88) };
}
