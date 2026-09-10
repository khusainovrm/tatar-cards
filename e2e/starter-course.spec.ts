import { expect, test } from '@playwright/test';

test('opens all twenty starter topics and studies a fifty-phrase group', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  const topics = page.locator('.group-card').filter({ hasText: 'А1 ·' });
  await expect(topics).toHaveCount(20);
  for (const topic of await topics.all()) await expect(topic).toContainText('50 карточек');
  await topics.filter({ hasText: 'Транспорт' }).getByRole('link', { name: 'Учить' }).click();
  await expect(page.getByText('50 осталось')).toBeVisible();
  await page.getByRole('button', { name: 'Показать перевод' }).click();
  await expect(page.locator('.translation')).toBeVisible();
  await page.getByRole('button', { name: /Знаю/ }).click();
  await expect(page.getByText('49 осталось')).toBeVisible();
  await page.goto('/cards');
  await page.getByLabel('Поиск по татарскому тексту или переводу').fill('Миңа полиция кирәк');
  await expect(page.locator('.catalog-row')).toHaveCount(1);
  await expect(page.locator('.catalog-row')).toContainText('Мне нужна полиция.');
  await page.reload();
  await expect(page.locator('.catalog-row')).toHaveCount(50);
});
