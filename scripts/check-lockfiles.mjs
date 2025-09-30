import { access } from 'fs/promises';
import path from 'path';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

const projectRoot = process.cwd();
const projectLockfile = path.join(projectRoot, 'package-lock.json');

async function findAncestorLockfiles() {
  const extras = [];
  let current = path.dirname(projectRoot);
  const { root } = path.parse(projectRoot);

  while (true) {
    const candidate = path.join(current, 'package-lock.json');
    if (candidate !== projectLockfile && await exists(candidate)) {
      extras.push(candidate);
    }
    if (current === root) break;
    current = path.dirname(current);
  }

  return extras;
}

const extras = await findAncestorLockfiles();

if (extras.length === 0) {
  console.log('✅ No extraneous package-lock.json files detected above project root.');
  process.exit(0);
}

console.error('⚠️ Found extraneous package-lock.json files outside this project:\n');
for (const file of extras) {
  console.error(` • ${file}`);
}

console.error('\nDelete the files above to stop Next.js from inferring a wider workspace root.');
console.error('Windows:  del "<path>"');
console.error('macOS/Linux:  rm "<path>"');
process.exit(1);
