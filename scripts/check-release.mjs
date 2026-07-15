import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const releaseTag = process.env.RELEASE_TAG || process.argv[2];
const errors = [];

const expected = {
  name: '@tonycdr-prog/metal-fx',
  repository: 'git+https://github.com/tonycdr-prog/metal-fx.git',
  homepage: 'https://tonycdr-prog.github.io/metal-fx/'
};

if (manifest.name !== expected.name) errors.push(`package name must be ${expected.name}`);
if (manifest.repository?.url !== expected.repository) errors.push(`repository must be ${expected.repository}`);
if (manifest.homepage !== expected.homepage) errors.push(`homepage must be ${expected.homepage}`);
if (manifest.private === true) errors.push('package.json must not set private=true for a public release');
if (manifest.publishConfig?.access !== 'public') errors.push('publishConfig.access must be public');
if (manifest.publishConfig?.registry !== 'https://registry.npmjs.org/') {
  errors.push('publishConfig.registry must be the public npm registry');
}
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) {
  errors.push(`package version is not a supported semver release: ${manifest.version}`);
}
if (releaseTag && releaseTag !== `v${manifest.version}`) {
  errors.push(`release tag ${releaseTag} does not match package version v${manifest.version}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

console.log(
  releaseTag
    ? `Release identity and tag checks passed for ${manifest.name}@${manifest.version}.`
    : `Release identity checks passed for ${manifest.name}@${manifest.version}; no tag was supplied.`
);
