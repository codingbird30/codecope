import JSZip from 'jszip';
import { EXT_LANG, SKIP_DIRS, MAX_FILES, MAX_FILE_SIZE } from './helpers';

export async function processZip(file) {
  const zip = await JSZip.loadAsync(file);
  const files = {};
  let count = 0;
  const entries = Object.keys(zip.files).sort();

  for (const path of entries) {
    if (zip.files[path].dir) continue;
    if (SKIP_DIRS.some(d => path.includes('/' + d + '/') || path.startsWith(d + '/'))) continue;
    const ext = path.split('.').pop().toLowerCase();
    if (!EXT_LANG[ext]) continue;
    if (count >= MAX_FILES) continue;

    const content = await zip.files[path].async('string');
    if (content.length > MAX_FILE_SIZE) continue;
    files[path] = content;
    count++;
  }

  if (count === 0) {
    throw new Error('No source files found in the zip (after filtering dependencies/binaries).');
  }

  return files;
}
