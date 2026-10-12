import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export async function checkAssets() {
  const root = new URL('../', import.meta.url);
  const lock = JSON.parse(await readFile(new URL('assets-lock.json', root), 'utf8'));
  for (const [file, expected] of Object.entries(lock.hashes)) {
    const data = await readFile(new URL(`public/${file}`, root));
    if (createHash('sha256').update(data).digest('hex') !== expected) throw new Error(`Damaged local asset: ${file}. Run npm run setup.`);
  }
  return Object.keys(lock.hashes).length;
}
if (process.argv[1]?.endsWith('check-assets.mjs')) {
  console.log(`Verified ${await checkAssets()} local model/runtime/reference files.`);
}
