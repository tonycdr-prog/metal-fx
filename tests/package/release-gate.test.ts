import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync('package.json', 'utf8')) as { name: string; version: string };

function checkRelease(tag: string): string {
  return execFileSync(process.execPath, ['scripts/check-release.mjs'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: { ...process.env, RELEASE_TAG: tag },
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

describe('release identity gate', () => {
  it('accepts only the tag matching the reviewed package version', () => {
    expect(checkRelease(`v${manifest.version}`)).toContain(`${manifest.name}@${manifest.version}`);
    expect(() => checkRelease('v999.0.0')).toThrow(`does not match package version v${manifest.version}`);
  });
});
