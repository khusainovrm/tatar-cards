# Татарча

Mobile-first PWA для изучения татарского языка по карточкам. Приложение работает без регистрации, поддерживает пользовательские карточки и группы, а прогресс сохраняет локально в браузере.

## Запуск

Требуется Node.js 22.12 или новее.

```bash
npm install
npm run dev
```

## Проверки

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Первый E2E-запуск требует браузер Playwright:

```bash
npx playwright install chromium
```

## Данные

Встроенные карточки находятся в [`cards.ts`](./cards.ts). Каждая карточка имеет стабильный идентификатор, татарский текст, русский перевод и тип `word` или `phrase`. Пользовательские изменения хранятся в `localStorage` под версионированным ключом.

## Деплой

Подготовка Android TWA и публикация в RuStore: [TWA-RUSTORE.md](./TWA-RUSTORE.md). Публичные параметры привязки задаются в `twa/release.config.json`; после заполнения выполните `npm run twa:prepare`.

Проект собирается в статический каталог `dist` и готов к деплою на Vercel. `vercel.json` перенаправляет клиентские маршруты на SPA entry point, а service worker и manifest генерируются при production-сборке.

Архитектура и требования описаны в [`openspec/changes/new-app`](./openspec/changes/new-app/).
