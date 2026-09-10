import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../application/AppState';

export function HomePage() {
  const { cards, groups, state } = useAppState();
  const [now] = useState(() => Date.now());
  const due = cards.filter((card) => {
    const progress = state.progressByCardId[card.id];
    return !progress || new Date(progress.dueAt).getTime() <= now;
  }).length;

  return (
    <div className="page home-page">
      <section className="hero">
        <p className="eyebrow">Татарский каждый день</p>
        <h1>Бер карточкадан башла.</h1>
        <p className="hero-copy">Начните с одной карточки. Короткие занятия, понятный прогресс и всё работает без регистрации.</p>
        <Link className="button primary large" to="/study/group-all-cards">Начать занятие</Link>
      </section>

      <section className="stats-grid" aria-label="Статистика">
        <article><strong>{cards.length}</strong><span>активных карточек</span></article>
        <article><strong>{due}</strong><span>готовы к повторению</span></article>
        <article><strong>{Math.max(0, groups.length - 1)}</strong><span>ваших групп</span></article>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Ваши подборки</p><h2>Выберите группу</h2></div>
          <Link to="/groups" className="text-link">Настроить группы</Link>
        </div>
        <div className="group-grid">
          {groups.map((group) => (
            <article className="group-card" key={group.id}>
              <div className="group-card-icon" aria-hidden="true">{group.system ? '∞' : group.name.slice(0, 1).toUpperCase()}</div>
              <div><h3>{group.name}</h3><p>{group.cardIds.length} карточек</p></div>
              <Link className={`button secondary ${group.cardIds.length === 0 ? 'disabled' : ''}`} aria-disabled={group.cardIds.length === 0} to={group.cardIds.length ? `/study/${group.id}` : '/groups'}>
                Учить
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
