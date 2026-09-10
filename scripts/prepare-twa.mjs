/* global URL, process, console, fetch, AbortSignal */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const configPath = new URL('twa/release.config.json', root);
const targetPath = new URL('public/.well-known/assetlinks.json', root);
const check = process.argv.includes('--check');

async function main() {
  const config = JSON.parse(await readFile(configPath, 'utf8'));
  if (typeof config.origin !== 'string') throw new Error('Заполните origin в twa/release.config.json: постоянный HTTPS-домен.');
  const origin = new URL(config.origin);
  if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash || origin.hostname === 'localhost' || origin.hostname.endsWith('.invalid')) {
    throw new Error('origin должен быть HTTPS-origin без пути, логина, query и fragment.');
  }
  if (typeof config.packageName !== 'string' || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(config.packageName)) {
    throw new Error('Укажите окончательный Android packageName, например ru.company.tatarcha.');
  }
  if (!Array.isArray(config.sha256CertFingerprints) || !config.sha256CertFingerprints.length || config.sha256CertFingerprints.some((fingerprint) => typeof fingerprint !== 'string' || !/^([0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(fingerprint))) {
    throw new Error('Нужен хотя бы один SHA-256 сертификата подписи: 32 пары HEX через двоеточие.');
  }
  const expected = [{
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: config.packageName,
      sha256_cert_fingerprints: [...new Set(config.sha256CertFingerprints.map((value) => value.toUpperCase()))]
    }
  }];
  if (check) {
    const local = JSON.parse(await readFile(targetPath, 'utf8'));
    if (JSON.stringify(local) !== JSON.stringify(expected)) throw new Error('assetlinks.json не совпадает с настройками. Выполните npm run twa:prepare.');
    console.log('Локальная привязка корректна. Это не проверка сертификата APK или production-домена.');
    if (process.argv.includes('--remote')) {
      const url = new URL('/.well-known/assetlinks.json', origin);
      const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      if (response.status !== 200 || !response.headers.get('content-type')?.includes('application/json')) {
        throw new Error(`assetlinks: ожидается HTTP 200 application/json без редиректов; получен ${response.status}.`);
      }
      if (JSON.stringify(await response.json()) !== JSON.stringify(expected)) throw new Error('Production assetlinks.json не совпадает с локальным.');
      const manifestResponse = await fetch(new URL('/manifest.webmanifest', origin), { redirect: 'manual', signal: AbortSignal.timeout(15000) });
      if (manifestResponse.status !== 200) throw new Error('Production manifest недоступен без редиректов.');
      const manifest = await manifestResponse.json();
      if (manifest.id !== '/' || manifest.start_url !== '/' || manifest.scope !== '/' || !manifest.icons?.some((icon) => icon.purpose === 'maskable')) throw new Error('Production manifest не соответствует подготовленному PWA.');
      console.log('Production assetlinks и manifest проверены. Проверка запуска TWA на Android всё ещё необходима.');
    }
  } else {
    // Do not overwrite an existing association with another Android application.
    try {
      const existing = JSON.parse(await readFile(targetPath, 'utf8'));
      if (!Array.isArray(existing) || existing.some((entry) => entry.target?.package_name !== config.packageName)) {
        throw new Error('assetlinks.json содержит другие привязки. Объедините их вручную, чтобы сохранить существующие приложения.');
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await mkdir(new URL('public/.well-known/', root), { recursive: true });
    await writeFile(targetPath, `${JSON.stringify(expected, null, 2)}\n`);
    console.log(`Создан ${fileURLToPath(targetPath)}. Пересоберите и опубликуйте PWA.`);
    console.log(`Web manifest: ${origin.origin}/manifest.webmanifest`);
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
