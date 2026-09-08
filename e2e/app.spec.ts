import { expect, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('creates a card and group, studies, and restores state after reload', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Татарский текст').fill('сынау сүзе');
  await page.getByLabel('Русский перевод').fill('тестовое слово');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  await expect(page.getByText('сынау сүзе')).toBeVisible();

  await page.goto('/groups');
  await page.getByPlaceholder('Например, Путешествие').fill('E2E группа');
  await page.getByRole('button', { name: 'Создать группу' }).click();
  await page.getByRole('button', { name: /E2E группа/ }).click();
  await page.getByRole('checkbox', { name: /сынау сүзе/ }).check();
  const groupCard = page.locator('article.group-card').filter({ hasText: 'E2E группа' });
  await expect(groupCard).toContainText('1 карточек');
  await groupCard.getByRole('link', { name: 'Учить' }).click();

  await page.getByRole('button', { name: 'Показать перевод' }).click();
  await expect(page.getByText('тестовое слово')).toBeVisible();
  await page.getByRole('button', { name: /Знаю/ }).click();
  await expect(page.getByText('Занятие завершено')).toBeVisible();

  await page.reload();
  await page.goto('/cards');
  await expect(page.getByText('сынау сүзе')).toBeVisible();
  await page.goto('/groups');
  await expect(page.locator('article.group-card').filter({ hasText: 'E2E группа' })).toContainText('1 карточек');
});

test('hides and restores built-in cards and cascades custom-card deletion only', async ({ page }) => {
  await page.goto('/cards');
  const firstBuiltIn = page.locator('article.catalog-row').first();
  const builtInText = await firstBuiltIn.locator('.card-copy strong').innerText();
  await firstBuiltIn.getByRole('button', { name: 'Скрыть' }).click();
  await expect(page.locator('.muted-section').getByText(builtInText, { exact: true })).toBeVisible();
  await page.locator('.muted-section').getByRole('button', { name: 'Вернуть' }).click();
  await expect(page.locator('.section-block').first().getByText(builtInText, { exact: true })).toBeVisible();

  await page.getByLabel('Татарский текст').fill('бетерелә');
  await page.getByLabel('Русский перевод').fill('будет удалено');
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('article.catalog-row').filter({ hasText: 'бетерелә' }).getByRole('button', { name: 'Удалить' }).click();
  await expect(page.getByText('бетерелә')).toHaveCount(0);
  await expect(page.getByText(builtInText, { exact: true })).toBeVisible();
});

test('runs from warmed cache while offline', async ({ page, context }) => {
  await page.goto('/cards');
  await page.getByRole('heading', { name: 'Карточки' }).waitFor();
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href;
    if (!href) throw new Error('Manifest link is missing');
    return await fetch(href).then((response) => response.json()) as { display: string; start_url: string; icons: { src: string }[] };
  });
  expect(manifest).toMatchObject({ display: 'standalone', start_url: '/' });
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  for (const icon of manifest.icons) {
    const response = await page.request.get(new URL(icon.src, page.url()).toString());
    expect(response.ok()).toBe(true);
  }
  await page.waitForFunction(async () => Boolean(await navigator.serviceWorker?.ready));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Карточки' })).toBeVisible();
  await page.goto('/study/group-all-cards');
  await expect(page.getByRole('button', { name: 'Показать перевод' })).toBeVisible();
});

test('defers a ready service-worker update during an active session', async ({ page, context }) => {
  await page.goto('/study/group-all-cards');
  await page.waitForFunction(async () => Boolean(await navigator.serviceWorker?.ready));
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  const originalWorker = readFileSync('dist/sw.js', 'utf8');
  try {
    writeFileSync('dist/sw.js', `${originalWorker}\n// e2e update candidate`);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    await expect(page.getByText('Доступно обновление.')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Обновить' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Показать перевод' })).toBeVisible();
    await page.getByRole('link', { name: /Выйти/ }).click();
    await expect(page.getByRole('button', { name: 'Обновить' })).toBeVisible();
  } finally {
    writeFileSync('dist/sw.js', originalWorker);
    await context.unrouteAll({ behavior: 'ignoreErrors' });
  }
});

test('supports keyboard study controls and has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  const longTatar = 'Бу — кечкенә экранда да тулысынча укылырга һәм идарә төймәләрен капламаска тиешле бик озын татарча өйрәнү җөмләсе.';
  await page.evaluate((front) => {
    const now = new Date().toISOString();
    localStorage.setItem('tatar-cards:user-state', JSON.stringify({
      schemaVersion: 1,
      customCards: [{ id: 'custom-long', front, back: 'Это очень длинное учебное предложение должно полностью читаться даже на маленьком экране и не закрывать элементы управления.', type: 'phrase', createdAt: now, updatedAt: now }],
      hiddenBuiltinCardIds: [],
      groups: [{ id: 'group-long', name: 'Длинные фразы', cardIds: ['custom-long'] }],
      progressByCardId: {},
      settings: { locale: 'ru' }
    }));
  }, longTatar);
  await page.goto('/study/group-long');
  await expect(page.getByText(longTatar)).toBeVisible();
  await page.keyboard.press('Space');
  await expect(page.getByText('По-русски')).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const studyCard = page.locator('.study-card');
  const bounds = await studyCard.boundingBox();
  if (!bounds) throw new Error('Study card has no bounds');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 40, bounds.y + bounds.height / 2);
  await expect(studyCard).toHaveCSS('transform', 'none');
  await page.mouse.up();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('button', { name: 'Отменить' })).toBeEnabled();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const undersizedTargets = await page.locator('a:visible, button:visible').evaluateAll((elements) => elements
    .map((element) => ({ text: element.textContent?.trim(), rect: element.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width < 40 || rect.height < 40)
    .map(({ text }) => text));
  expect(undersizedTargets).toEqual([]);
  await page.locator('body').press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
