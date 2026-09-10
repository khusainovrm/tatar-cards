import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directories: string[] = [];
const config = { origin: 'https://twa.example.com', packageName: 'ru.example.test', sha256CertFingerprints: [Array(32).fill('AB').join(':')] };

function fixture(value: unknown) {
  const root = mkdtempSync(join(tmpdir(), 'tatarcha-twa-test-'));
  directories.push(root);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'twa'));
  copyFileSync(resolve('scripts/prepare-twa.mjs'), join(root, 'scripts/prepare-twa.mjs'));
  writeFileSync(join(root, 'twa/release.config.json'), JSON.stringify(value));
  return {
    target: join(root, 'public/.well-known/assetlinks.json'),
    run: (...args: string[]) => spawnSync(process.execPath, [join(root, 'scripts/prepare-twa.mjs'), ...args], { encoding: 'utf8' })
  };
}

afterEach(() => { for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });

describe('TWA asset links preparation', () => {
  it('rejects missing release data without publishing a placeholder', () => {
    const test = fixture({ origin: null });
    expect(test.run().status).toBe(1);
    expect(existsSync(test.target)).toBe(false);
  });

  it('writes the selected package and certificate and checks the result', () => {
    const test = fixture(config);
    expect(test.run().status).toBe(0);
    expect(JSON.parse(readFileSync(test.target, 'utf8'))).toEqual([{
      relation: ['delegate_permission/common.handle_all_urls'],
      target: { namespace: 'android_app', package_name: config.packageName, sha256_cert_fingerprints: config.sha256CertFingerprints }
    }]);
    expect(test.run('--check').status).toBe(0);
  });

  it('rejects insecure origins and malformed certificates', () => {
    expect(fixture({ ...config, origin: 'http://twa.example.com' }).run().status).toBe(1);
    expect(fixture({ ...config, sha256CertFingerprints: ['wrong'] }).run().status).toBe(1);
  });

  it('preserves existing associations with another app', () => {
    const test = fixture(config);
    expect(test.run().status).toBe(0);
    const existing = JSON.stringify([{ target: { package_name: 'ru.other.app' } }]);
    writeFileSync(test.target, existing);
    expect(test.run().status).toBe(1);
    expect(readFileSync(test.target, 'utf8')).toBe(existing);
  });
});
