import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../../application/AppState';
import type { GroupId } from '../../features/cards/domain/model';

export function GroupsPage() {
  const { cards, groups, addGroup, editGroup, removeGroup, setMembership, safeModeReason } = useAppState();
  const customGroups = groups.filter((group) => !group.system);
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<GroupId | null>(customGroups[0]?.id ?? null);
  const [error, setError] = useState('');
  const selectedGroup = customGroups.find((group) => group.id === selected);
  const readOnly = Boolean(safeModeReason);

  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      addGroup(name);
      setName('');
      setError('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Не удалось создать группу');
    }
  }

  return (
    <div className="page">
      <div className="page-heading"><div><p className="eyebrow">Подборки</p><h1>Группы</h1></div><span className="count-pill">{groups.length} всего</span></div>
      <form className="inline-form" onSubmit={submit}>
        <label><span className="sr-only">Название новой группы</span><input disabled={readOnly} value={name} onChange={(event) => setName(event.target.value)} placeholder="Например, Путешествие" /></label>
        <button disabled={readOnly} className="button primary" type="submit">Создать группу</button>
      </form>
      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="groups-layout">
        <section className="group-list" aria-label="Список групп">
          {groups.map((group) => (
            <article className={`group-card ${selected === group.id ? 'selected' : ''}`} key={group.id}>
              <button className="group-select" type="button" onClick={() => setSelected(group.system ? null : group.id)}>
                <span className="group-card-icon" aria-hidden="true">{group.system ? '∞' : group.name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{group.name}</strong><small>{group.cardIds.length} карточек</small></span>
              </button>
              <Link className={`button secondary ${group.cardIds.length === 0 ? 'disabled' : ''}`} to={group.cardIds.length ? `/study/${group.id}` : '/groups'}>Учить</Link>
              {!group.system && <div className="row-actions">
                <button disabled={readOnly} className="icon-button" type="button" onClick={() => {
                  const next = window.prompt('Новое название группы', group.name);
                  if (next !== null) {
                    try { editGroup(group.id, next); setError(''); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Ошибка'); }
                  }
                }}>Переименовать</button>
                <button disabled={readOnly} className="icon-button danger-text" type="button" onClick={() => {
                  if (window.confirm(`Удалить группу «${group.name}»? Карточки останутся в словаре.`)) {
                    removeGroup(group.id);
                    if (selected === group.id) setSelected(null);
                  }
                }}>Удалить</button>
              </div>}
            </article>
          ))}
        </section>

        <section className="membership-panel">
          {selectedGroup ? <>
            <div><p className="eyebrow">Состав группы</p><h2>{selectedGroup.name}</h2></div>
            {cards.length === 0 ? <p className="empty-copy">Сначала добавьте или восстановите карточки.</p> : <div className="check-list">{cards.map((card) => <label key={card.id}><input disabled={readOnly} type="checkbox" checked={selectedGroup.cardIds.includes(card.id)} onChange={(event) => setMembership(selectedGroup.id, card.id, event.target.checked)} /><span><strong lang="tt">{card.front}</strong><small>{card.back}</small></span></label>)}</div>}
          </> : <div className="empty-panel"><span aria-hidden="true">↖</span><h2>Выберите свою группу</h2><p>Здесь можно настроить её состав. «Все карточки» обновляется автоматически.</p></div>}
        </section>
      </div>
    </div>
  );
}
