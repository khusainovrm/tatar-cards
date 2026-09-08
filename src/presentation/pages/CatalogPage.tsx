import { useState, type FormEvent } from 'react';
import { useAppState } from '../../application/AppState';
import type { CardContent, CardType, CustomCard, CustomCardId } from '../../features/cards/domain/model';

const emptyForm: CardContent = { front: '', back: '', type: 'word' };

export function CatalogPage() {
  const { cards, hiddenCards, addCard, editCard, removeCard, hideCard, restoreCard, safeModeReason } = useAppState();
  const [form, setForm] = useState<CardContent>(emptyForm);
  const [editing, setEditing] = useState<CustomCardId | null>(null);
  const [error, setError] = useState('');
  const readOnly = Boolean(safeModeReason);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.front.trim() || !form.back.trim()) {
      setError('Заполните татарский текст и русский перевод.');
      return;
    }
    if (editing) editCard(editing, form);
    else addCard(form);
    setForm(emptyForm);
    setEditing(null);
    setError('');
  }

  function startEdit(card: CustomCard) {
    setEditing(card.id);
    setForm({ front: card.front, back: card.back, type: card.type });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="page">
      <div className="page-heading"><div><p className="eyebrow">Словарь</p><h1>Карточки</h1></div><span className="count-pill">{cards.length} активных</span></div>

      <form className="editor-card" onSubmit={submit} aria-label={editing ? 'Редактирование карточки' : 'Новая карточка'}>
        <h2>{editing ? 'Редактировать карточку' : 'Добавить карточку'}</h2>
        <div className="form-grid">
          <label>Татарский текст<input disabled={readOnly} value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} /></label>
          <label>Русский перевод<input disabled={readOnly} value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} /></label>
          <label>Тип<select disabled={readOnly} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as CardType })}><option value="word">Слово</option><option value="phrase">Фраза</option></select></label>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="button-row"><button disabled={readOnly} className="button primary" type="submit">{editing ? 'Сохранить' : 'Добавить'}</button>{editing && <button className="button ghost" type="button" onClick={() => { setEditing(null); setForm(emptyForm); }}>Отмена</button>}</div>
      </form>

      <section className="section-block">
        <h2>Активные</h2>
        <div className="catalog-list">
          {cards.map((card) => {
            const custom = card.id.startsWith('custom-');
            return (
              <article className="catalog-row" key={card.id}>
                <span className="type-badge">{card.type === 'word' ? 'слово' : 'фраза'}</span>
                <div className="card-copy"><strong lang="tt">{card.front}</strong><span>{card.back}</span></div>
                <div className="row-actions">
                  {custom ? <>
                    <button disabled={readOnly} className="icon-button" type="button" onClick={() => startEdit(card as CustomCard)}>Изменить</button>
                    <button disabled={readOnly} className="icon-button danger-text" type="button" onClick={() => {
                      if (window.confirm('Удалить карточку и её прогресс?')) removeCard(card.id as CustomCardId);
                    }}>Удалить</button>
                  </> : <button disabled={readOnly} className="icon-button" type="button" onClick={() => hideCard(card.id as `builtin-${string}`)}>Скрыть</button>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {hiddenCards.length > 0 && <section className="section-block muted-section"><h2>Скрытые</h2><div className="catalog-list">{hiddenCards.map((card) => <article className="catalog-row" key={card.id}><span className="type-badge muted">скрыта</span><div className="card-copy"><strong lang="tt">{card.front}</strong><span>{card.back}</span></div><button disabled={readOnly} className="icon-button" type="button" onClick={() => restoreCard(card.id)}>Вернуть</button></article>)}</div></section>}
    </div>
  );
}
