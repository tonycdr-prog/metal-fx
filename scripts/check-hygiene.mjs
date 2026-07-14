import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'repo-hygiene.config.json'), 'utf8'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const errors = [];
const notices = [];
const ignoredDirs = new Set(['.git', 'node_modules', 'dist', 'dist-demo', 'dist-playground', '.wrangler']);
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.mjs', '.ts', '.tsx', '.yml', '.yaml']);
const codeExtensions = new Set(['.css', '.js', '.mjs', '.ts', '.tsx']);

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) return [];
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function repoPath(path) {
  return relative(root, path).split(sep).join('/');
}

const files = walk(root);
const textFiles = files.filter((path) => textExtensions.has(extname(path)) && !path.endsWith('.codebase-scan.txt'));
const corpus = textFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
const usageCorpus = textFiles
  .filter((path) => {
    const name = repoPath(path);
    return (
      name.startsWith('src/') ||
      name.startsWith('demo/') ||
      name.startsWith('tests/') ||
      name.startsWith('scripts/') ||
      name.startsWith('.github/') ||
      name.startsWith('vite.config') ||
      name === 'vitest.config.ts' ||
      name === 'playwright.config.ts'
    );
  })
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

function checkFileSizes() {
  const reviewedPaths = new Set(Object.keys(config.largeFileReviews));
  for (const path of files.filter((item) => codeExtensions.has(extname(item)))) {
    const name = repoPath(path);
    const count = readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim()).length;
    const review = config.largeFileReviews[name];
    if (count > config.lineFailThreshold && review?.kind !== 'exception' && review?.kind !== 'declarative') {
      errors.push(
        `${name}: ${count} nonblank lines exceeds ${config.lineFailThreshold}; decompose it or record a justified exception.`
      );
    } else if (count > config.lineReviewThreshold && !review) {
      errors.push(`${name}: ${count} nonblank lines requires a review entry in repo-hygiene.config.json.`);
    } else if (count > config.lineReviewThreshold) {
      if (!review.reason || !review.revisitWhen)
        errors.push(`${name}: large-file review needs reason and revisitWhen.`);
      notices.push(`${name}: ${count} nonblank lines (${review.kind}).`);
    }
    reviewedPaths.delete(name);
  }
  for (const stale of reviewedPaths)
    errors.push(`${stale}: stale large-file review; remove it or restore the reviewed file.`);
}

function resolveImport(from, specifier) {
  const base = normalize(resolve(dirname(from), specifier));
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')];
  return candidates.find((candidate) => existsSync(candidate)) ?? base;
}

function checkBoundaries() {
  const sourceFiles = files.filter((path) => ['.ts', '.tsx'].includes(extname(path)));
  const importPattern = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const path of sourceFiles) {
    const name = repoPath(path);
    for (const match of readFileSync(path, 'utf8').matchAll(importPattern)) {
      const specifier = match[1];
      if (name.startsWith('src/engine/') && (specifier === 'react' || specifier.startsWith('react/'))) {
        errors.push(`${name}: engine modules must not import React.`);
      }
      if (!specifier.startsWith('.')) continue;
      const target = repoPath(resolveImport(path, specifier));
      if (name.startsWith('src/engine/renderer/') && /src\/engine\/(glow|reflection)\//.test(target)) {
        errors.push(`${name}: renderer modules must not import glow or reflection implementations (${target}).`);
      }
      if (name.startsWith('src/engine/glow/') && target.startsWith('src/engine/reflection/')) {
        errors.push(`${name}: glow modules must not import reflection implementations.`);
      }
      if (name.startsWith('src/engine/reflection/') && target.startsWith('src/engine/glow/')) {
        errors.push(`${name}: reflection modules must not import glow implementations.`);
      }
      if (name.startsWith('demo/') && target.startsWith('src/') && target !== 'src' && target !== 'src/index.ts') {
        errors.push(`${name}: demo code must consume the library through src/index.ts, not ${target}.`);
      }
    }
  }
  if (Object.keys(pkg.exports ?? {}).some((key) => key !== '.'))
    errors.push('package.json: public subpath exports require an approved API change.');
  if (/export\s+\*/.test(readFileSync(join(root, 'src/index.ts'), 'utf8')))
    errors.push('src/index.ts: export-all statements are forbidden.');
}

function checkScriptsAndDependencies() {
  const scripts = Object.values(pkg.scripts ?? {}).join('\n');
  for (const [name, command] of Object.entries(pkg.scripts ?? {})) {
    for (const match of command.matchAll(/--config\s+([^\s&]+)/g)) {
      if (!existsSync(join(root, match[1]))) errors.push(`package.json script ${name}: missing config ${match[1]}.`);
    }
  }
  const allDependencies = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
  for (const dependency of Object.keys(allDependencies)) {
    const base = dependency.startsWith('@types/') ? dependency.slice('@types/'.length).replace('__', '/') : dependency;
    const commands = config.dependencyCommands[dependency] ?? [];
    const used =
      usageCorpus.includes(`'${dependency}'`) ||
      usageCorpus.includes(`"${dependency}"`) ||
      (dependency.startsWith('@types/') && (usageCorpus.includes(`'${base}'`) || usageCorpus.includes(`"${base}"`))) ||
      commands.some((command) => new RegExp(`(^|[;&|\\s])${command}(?=\\s|$)`, 'm').test(scripts));
    if (!used) errors.push(`package.json: dependency ${dependency} appears unused.`);
  }
}

function checkAssets() {
  const publicDir = join(root, 'demo/public');
  const assets = walk(publicDir);
  const hashes = new Map();
  for (const path of assets) {
    const name = repoPath(path);
    const basename = relative(publicDir, path).split(sep).join('/');
    if (!config.allowedPublicAssets.includes(basename) && !corpus.includes(`/${basename}`)) {
      errors.push(`${name}: public asset has no source reference or explicit allowance.`);
    }
    const hash = createHash('sha256').update(readFileSync(path)).digest('hex');
    const prior = hashes.get(hash);
    if (prior) errors.push(`${name}: byte-identical duplicate of ${prior}.`);
    else hashes.set(hash, name);
  }
}

function checkTestLocations() {
  for (const path of files.filter((item) => /\.(test|spec)\.[^.]+$/.test(item))) {
    const name = repoPath(path);
    if (
      !name.startsWith('src/') &&
      !name.startsWith('demo/') &&
      !name.startsWith('tests/e2e/') &&
      !name.startsWith('tests/package/')
    ) {
      errors.push(`${name}: tests must be co-located or live under tests/e2e or tests/package.`);
    }
  }
}

checkFileSizes();
checkBoundaries();
checkScriptsAndDependencies();
checkAssets();
checkTestLocations();

for (const notice of notices) console.log(`review: ${notice}`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  console.error(`\nHygiene failed with ${errors.length} error(s).`);
  process.exit(1);
}
console.log('Repository hygiene checks passed.');
