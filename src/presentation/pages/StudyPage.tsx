import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type PointerEvent as ReactPointerEvent
} from 'react';
import {Link, useParams} from 'react-router-dom';
import {useAppState} from '../../application/AppState';
import type {CardId} from '../../features/cards/domain/model';
import {
    createStudySession,
    progressAfterRating,
    rateCurrentCard,
    revealAnswer,
    skipMissingCards,
    undoLastRating,
    type StudyRating,
    type StudySession
} from '../../features/study/domain/session';

interface DragState {
    startX: number;
    startedAt: number;
    pointerId: number
}

type CardAnimation = 'idle' | 'exit-left' | 'exit-right' | 'entering';

interface PendingRating {
    rating: StudyRating;
    session: StudySession;
    previousProgress: ReturnType<typeof progressAfterRating> | undefined;
}

export function StudyPage() {
    const {groupId} = useParams();
    const {cards, groups, state, setProgress} = useAppState();
    const group = groups.find((item) => item.id === groupId);
    const [session, setSession] = useState<StudySession | null>(() => group?.cardIds.length ? createStudySession(group.cardIds, state.progressByCardId) : null);
    const [dragX, setDragX] = useState(0);
    const [cardAnimation, setCardAnimation] = useState<CardAnimation>('idle');
    const [reverseSides, setReverseSides] = useState(false);
    const drag = useRef<DragState | null>(null);
    const pendingRating = useRef<PendingRating | null>(null);
    const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
    const current = session?.currentCardId ? cardMap.get(session.currentCardId) : undefined;

    useEffect(() => {
        // Card availability is external to the session snapshot and must be reconciled after catalog changes.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession((value) => value ? skipMissingCards(value, new Set(cardMap.keys()) as Set<CardId>) : value);
    }, [cardMap]);

    const finishRating = useCallback(() => {
        const pending = pendingRating.current;
        if (!pending) return;
        pendingRating.current = null;
        const cardId = pending.session.currentCardId;
        if (!cardId) return;
        setProgress(cardId, progressAfterRating(pending.previousProgress, pending.rating));
        setSession(rateCurrentCard(pending.session, pending.rating, pending.previousProgress));
        setDragX(0);
        setCardAnimation('entering');
    }, [setProgress]);

    const rate = useCallback((rating: StudyRating) => {
        if (!session?.currentCardId || cardAnimation !== 'idle') return;
        const cardId = session.currentCardId;
        const previous = state.progressByCardId[cardId];
        pendingRating.current = {rating, session, previousProgress: previous};
        setCardAnimation(rating === 'known' ? 'exit-right' : 'exit-left');
    }, [cardAnimation, session, state.progressByCardId]);

    useEffect(() => {
        if (cardAnimation === 'idle') return;
        const fallback = window.setTimeout(() => {
            if (cardAnimation.startsWith('exit-')) finishRating();
            else setCardAnimation('idle');
        }, cardAnimation === 'entering' ? 300 : 350);
        return () => window.clearTimeout(fallback);
    }, [cardAnimation, finishRating]);

    const undo = useCallback(() => {
        if (!session || cardAnimation !== 'idle') return;
        const result = undoLastRating(session);
        if (!result.entry) return;
        setProgress(result.entry.cardId, result.entry.previousProgress);
        setSession(result.session);
    }, [cardAnimation, session, setProgress]);

    useEffect(() => {
        const listener = (event: KeyboardEvent) => {
            if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
            if (event.code === 'Space') {
                event.preventDefault();
                setSession((value) => value ? revealAnswer(value) : value);
            }
            if (event.key === 'ArrowRight') rate('known');
            if (event.key === 'ArrowLeft') rate('learning');
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') undo();
        };
        window.addEventListener('keydown', listener);
        return () => window.removeEventListener('keydown', listener);
    }, [rate, undo]);

    function pointerDown(event: ReactPointerEvent<HTMLElement>) {
        if (!session?.currentCardId || cardAnimation !== 'idle') return;
        drag.current = {
            startX: event.clientX,
            startedAt: performance.now(),
            pointerId: event.pointerId
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function pointerMove(event: ReactPointerEvent<HTMLElement>) {
        if (!drag.current || drag.current.pointerId !== event.pointerId) return;
        setDragX(event.clientX - drag.current.startX);
    }

    function pointerUp(event: ReactPointerEvent<HTMLElement>) {
        if (!drag.current) return;
        const distance = event.clientX - drag.current.startX;
        const elapsed = Math.max(1, performance.now() - drag.current.startedAt);
        const velocity = Math.abs(distance) / elapsed;
        drag.current = null;
        if (Math.abs(distance) >= 72 || (Math.abs(distance) >= 28 && velocity >= 0.45)) rate(distance > 0 ? 'known' : 'learning');
        else setDragX(0);
    }

    if (!group) return <div className="page centered"><h1>Группа не найдена</h1><Link
        className="button primary" to="/groups">К группам</Link></div>;
    if (!session) return <div className="page centered"><p className="eyebrow">{group.name}</p>
        <h1>Здесь пока нечего учить</h1><p>Добавьте карточки в эту группу или восстановите
            скрытые.</p><Link className="button primary" to="/groups">Настроить группу</Link></div>;
    if (session.complete) return <div className="page study-page centered"><p
        className="eyebrow">Занятие завершено</p><h1>Бик яхшы!</h1><p className="hero-copy">Отличная
        работа. Возвращайтесь позже, чтобы закрепить результат.</p>
        <div className="result-grid">
            <div><strong>{session.results.known}</strong><span>знаю</span></div>
            <div><strong>{session.results.learning}</strong><span>изучаю</span></div>
        </div>
        <div className="button-row"><Link className="button primary" to="/">На главную</Link>
            <button className="button secondary" type="button" onClick={undo}
                    disabled={!session.history.length}>Отменить последний ответ
            </button>
        </div>
    </div>;

    return (
        <div className="page study-page">
            <header className="study-heading"><Link to="/" className="text-link">← Выйти</Link>
                <div><strong>{group.name}</strong><span>{session.queue.length + 1} осталось</span>
                </div>
                <button className="text-button" type="button" onClick={undo}
                        disabled={!session.history.length || cardAnimation !== 'idle'}>Отменить
                </button>
            </header>
            <div className="progress-track"
                 aria-label={`${session.queue.length + 1} карточек осталось`}><span
                style={{width: `${Math.max(8, 100 * (1 - (session.queue.length + 1) / session.sourceCardIds.length))}%`}}/>
            </div>
            <label className="study-direction-toggle">
                <span><strong>Сначала по-русски</strong><small>Отгадывать перевод на татарский</small></span>
                <input
                    type="checkbox"
                    checked={reverseSides}
                    disabled={cardAnimation !== 'idle'}
                    onChange={(event) => setReverseSides(event.target.checked)}
                />
            </label>
            <section
                className={`study-card ${session.revealed ? 'revealed' : ''} ${cardAnimation}`}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerUp}
                onPointerCancel={() => {
                    drag.current = null;
                    setDragX(0);
                }}
                onAnimationEnd={() => {
                    if (cardAnimation.startsWith('exit-')) finishRating();
                    else if (cardAnimation === 'entering') setCardAnimation('idle');
                }}
                style={{
                    '--drag-x': `${dragX}px`,
                    '--drag-rotate': `${dragX / 18}deg`,
                    '--drag-opacity': Math.min(1, Math.abs(dragX) / 70)
                } as CSSProperties}
            >
                <span className="swipe-label learning" aria-hidden="true">ИЗУЧАЮ</span><span
                className="swipe-label known" aria-hidden="true">ЗНАЮ</span>
                <p className="card-side-label">{reverseSides ? 'По-русски' : 'Татарча'}</p>
                <h1 lang={reverseSides ? 'ru' : 'tt'}>{reverseSides ? current?.back : current?.front}</h1>
                {session.revealed ?
                    <div className="translation"><span>{reverseSides ? 'Татарча' : 'По-русски'}</span>
                        <p lang={reverseSides ? 'tt' : 'ru'}>{reverseSides ? current?.front : current?.back}</p>
                    </div> : <button className="reveal-button" type="button"
                                     onClick={() => setSession(revealAnswer(session))}>Показать
                        перевод</button>}
            </section>
            <div className="study-controls">
                <button disabled={cardAnimation !== 'idle'} className="rating-button learning"
                        type="button" onClick={() => rate('learning')}><span
                    aria-hidden="true">←</span><span>Изучаю<small>свайп влево</small></span>
                </button>
                <button disabled={cardAnimation !== 'idle'} className="rating-button known" type="button"
                        onClick={() => rate('known')}>
                    <span>Знаю<small>свайп вправо</small></span><span aria-hidden="true">→</span>
                </button>
            </div>
        </div>
    );
}
