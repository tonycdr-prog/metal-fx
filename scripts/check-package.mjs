import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: root, encoding: 'utf8' });
const [{ files }] = JSON.parse(output);
const required = new Set([
  'LICENSE',
  'README.md',
  'package.json',
  'dist/index.d.ts',
  'dist/index.es.js',
  'dist/index.cjs'
]);
const allowed = /^(LICENSE|README\.md|package\.json|dist\/index\.(?:d\.ts|es\.js|cjs))$/;
const actual = new Set(files.map(({ path }) => path));
const errors = [];

for (const path of required) {
  if (!actual.has(path)) errors.push(`missing required package file: ${path}`);
}
for (const path of actual) {
  if (!allowed.test(path)) errors.push(`unexpected package file: ${path}`);
}

if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(`Package contents check passed (${actual.size} files).`);
