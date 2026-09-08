import { NavLink, Route, Routes } from 'react-router-dom';
import { useAppState } from '../application/AppState';
import { CatalogPage } from './pages/CatalogPage';
import { GroupsPage } from './pages/GroupsPage';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { UpdatePrompt } from './components/UpdatePrompt';

export function App() {
  const { safeModeReason, unsavedError, retrySave, resetLocalData } = useAppState();

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Татарча — главная">
          <span className="brand-mark" aria-hidden="true">Т</span>
          <span>Татарча</span>
        </NavLink>
        <nav aria-label="Основная навигация">
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/cards">Карточки</NavLink>
          <NavLink to="/groups">Группы</NavLink>
        </nav>
      </header>

      {safeModeReason && (
        <section className="banner banner-danger" role="alert">
          <div><strong>Безопасный режим.</strong> Пользовательские данные не загружены: {safeModeReason}</div>
          <button type="button" className="button danger" onClick={() => {
            if (window.confirm('Удалить повреждённые локальные данные? Отменить действие будет невозможно.')) resetLocalData();
          }}>Сбросить данные</button>
        </section>
      )}
      {unsavedError && (
        <section className="banner banner-warning" role="alert">
          <span>{unsavedError}</span>
          <button type="button" className="button secondary" onClick={retrySave}>Повторить сохранение</button>
        </section>
      )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cards" element={<CatalogPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/study/:groupId" element={<StudyPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <UpdatePrompt />
    </div>
  );
}
