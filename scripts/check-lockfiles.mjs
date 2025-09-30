import { access, rm } from 'fs/promises';
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
const deleteMode = process.argv.includes('--delete') || process.argv.includes('--fix');

if (extras.length === 0) {
  if (deleteMode) {
    console.log('✅ No extraneous package-lock.json files detected. Nothing to delete.');
  } else {
    console.log('✅ No extraneous package-lock.json files detected above project root.');
  }
  process.exit(0);
}

if (!deleteMode) {
  console.error('⚠️ Found extraneous package-lock.json files outside this project:\n');
  for (const file of extras) {
    console.error(` • ${file}`);
  }

  console.error('\nDelete the files above to stop Next.js from inferring a wider workspace root.');
  console.error('Windows:  del "<path>"');
  console.error('macOS/Linux:  rm "<path>"');
  console.error('Run "npm run clean:lockfiles" to remove them automatically.');
  process.exit(1);
}

let failed = false;
for (const file of extras) {
  try {
    await rm(file);
    console.log(`🧹 Removed ${file}`);
  } catch (error) {
    failed = true;
    console.error(`❌ Failed to remove ${file}:`, error.message ?? error);
  }
}

if (failed) {
  console.error('\nSome lockfiles could not be deleted automatically. Please remove them manually.');
  process.exit(1);
}

console.log('\n✅ All extraneous package-lock.json files removed.');
process.exit(0);
