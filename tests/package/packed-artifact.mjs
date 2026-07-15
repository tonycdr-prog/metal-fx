import { execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const temporary = mkdtempSync(join(tmpdir(), 'metal-fx-package-'));
const packageName = '@tonycdr-prog/metal-fx';
const allowedPackageFiles = new Set([
  'LICENSE',
  'README.md',
  'package.json',
  'dist/index.cjs',
  'dist/index.d.ts',
  'dist/index.es.js'
]);

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function writeFixture(name, packageJson, files) {
  const fixture = join(temporary, name);
  mkdirSync(fixture);
  writeFileSync(join(fixture, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);
  for (const [path, contents] of Object.entries(files)) writeFileSync(join(fixture, path), contents);
  return fixture;
}

function installTarball(fixture) {
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund'], fixture);
  const installedPath = join(fixture, 'node_modules', ...packageName.split('/'));
  if (lstatSync(installedPath).isSymbolicLink()) {
    throw new Error('package fixture installed a workspace symlink instead of the packed tarball');
  }
  const installed = realpathSync(installedPath);
  if (installed === root || !relative(root, installed).startsWith('..')) {
    throw new Error(`${packageName} fixture resolved from the workspace instead of the packed tarball`);
  }
}

function assertPackageContents(files) {
  const actual = new Set(files.map(({ path }) => path));
  for (const path of allowedPackageFiles) {
    if (!actual.has(path)) throw new Error(`packed tarball is missing required file: ${path}`);
  }
  for (const path of actual) {
    if (!allowedPackageFiles.has(path)) throw new Error(`packed tarball contains unapproved file: ${path}`);
  }
}

try {
  run('npm', ['run', 'build'], root);
  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--json', '--pack-destination', temporary], { cwd: root, encoding: 'utf8' })
  );
  const [{ filename, files }] = packed;
  const tarball = join(temporary, filename);
  assertPackageContents(files);

  const commonjs = writeFixture(
    'commonjs',
    {
      private: true,
      dependencies: {
        [packageName]: tarball,
        react: '18.3.1',
        'react-dom': '18.3.1'
      }
    },
    {
      'index.cjs': `const packageExports = require('${packageName}');
if (!packageExports.MetalFx || !packageExports.PRESETS || typeof packageExports.createInstance !== 'function') {
  throw new Error('CommonJS consumer did not receive the documented public exports');
}
`
    }
  );
  installTarball(commonjs);
  run(process.execPath, ['index.cjs'], commonjs);

  const esm = writeFixture(
    'esm',
    {
      private: true,
      type: 'module',
      dependencies: {
        [packageName]: tarball,
        react: '18.3.1',
        'react-dom': '18.3.1'
      }
    },
    {
      'index.mjs': `import { MetalFx, PRESETS, createInstance } from '${packageName}';
if (!MetalFx || PRESETS.gold.name !== 'gold' || typeof createInstance !== 'function') {
  throw new Error('ESM consumer did not receive the documented named exports');
}
`
    }
  );
  installTarball(esm);
  run(process.execPath, ['index.mjs'], esm);

  const typescript = writeFixture(
    'typescript',
    {
      private: true,
      type: 'module',
      dependencies: {
        [packageName]: tarball,
        react: '18.3.1',
        'react-dom': '18.3.1'
      },
      devDependencies: {
        '@types/react': '18.3.1',
        '@types/react-dom': '18.3.1',
        typescript: '5.3.3'
      }
    },
    {
      'tsconfig.json': `${JSON.stringify(
        {
          compilerOptions: {
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            noEmit: true,
            strict: true,
            target: 'ES2022'
          }
        },
        null,
        2
      )}\n`,
      'index.ts': `import {
  MetalFx,
  PRESETS,
  FINISHES,
  createInstance,
  destroyInstance,
  pauseShared,
  resumeShared,
  setSharedPreset,
  updateInstance,
  type MetalFxInstance,
  type MetalFxPreset,
  type MetalFxFinish,
  type MetalFxProps
} from '${packageName}';

const props: MetalFxProps = { children: null, preset: 'gold', finish: 'brushed', interactive: true, theme: 'dark' };
const preset: MetalFxPreset = PRESETS.gold.name;
const finish: MetalFxFinish = FINISHES.brushed.name;
const rendererExports = { createInstance, destroyInstance, pauseShared, resumeShared, setSharedPreset, updateInstance };
const instance: MetalFxInstance | null = null;

void [MetalFx, props, preset, finish, rendererExports, instance];
`
    }
  );
  installTarball(typescript);
  run(
    process.platform === 'win32' ? 'node_modules/.bin/tsc.cmd' : 'node_modules/.bin/tsc',
    ['--project', 'tsconfig.json'],
    typescript
  );

  console.log('Packed artifact checks passed (CommonJS, ESM, strict TypeScript, and approved file list).');
} finally {
  rmSync(temporary, { force: true, recursive: true });
}
