import type { CardId, CardProgress } from '../../cards/domain/model';

export type StudyRating = 'known' | 'learning';

export interface StudyResultCounts {
  known: number;
  learning: number;
}

interface SessionSnapshot {
  queue: CardId[];
  currentCardId: CardId | null;
  revealed: boolean;
  results: StudyResultCounts;
  learningRequeues: Partial<Record<CardId, number>>;
}

export interface StudyHistoryEntry {
  snapshot: SessionSnapshot;
  cardId: CardId;
  previousProgress?: CardProgress;
}

export interface StudySession extends SessionSnapshot {
  sourceCardIds: CardId[];
  history: StudyHistoryEntry[];
  complete: boolean;
}

function priority(cardId: CardId, progress: Partial<Record<CardId, CardProgress>>, now: Date): number {
  const item = progress[cardId];
  if (!item) return 1;
  return new Date(item.dueAt).getTime() <= now.getTime() ? 0 : 2;
}

export function createStudySession(
  cardIds: readonly CardId[],
  progress: Partial<Record<CardId, CardProgress>>,
  now = new Date()
): StudySession {
  const sourceCardIds = [...new Set(cardIds)];
  if (sourceCardIds.length === 0) throw new Error('В группе нет карточек для изучения');
  const ordered = sourceCardIds
    .map((id, index) => ({ id, index, priority: priority(id, progress, now) }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index)
    .map(({ id }) => id);
  const [currentCardId = null, ...queue] = ordered;
  return {
    sourceCardIds,
    queue,
    currentCardId,
    revealed: false,
    results: { known: 0, learning: 0 },
    learningRequeues: {},
    history: [],
    complete: currentCardId === null
  };
}

export function revealAnswer(session: StudySession): StudySession {
  if (!session.currentCardId || session.complete) return session;
  return { ...session, revealed: true };
}

export function skipMissingCards(session: StudySession, existingIds: ReadonlySet<CardId>): StudySession {
  if (session.currentCardId && existingIds.has(session.currentCardId)) return session;
  const queue = session.queue.filter((id) => existingIds.has(id));
  const [currentCardId = null, ...rest] = queue;
  return { ...session, currentCardId, queue: rest, revealed: false, complete: currentCardId === null };
}

const KNOWN_INTERVALS_MS = [86_400_000, 259_200_000, 604_800_000, 1_209_600_000, 2_592_000_000] as const;
const LEARNING_INTERVAL_MS = 600_000;

export function progressAfterRating(previous: CardProgress | undefined, rating: StudyRating, now = new Date()): CardProgress {
  const knownCount = previous?.knownCount ?? 0;
  const learningCount = previous?.learningCount ?? 0;
  const interval = rating === 'learning'
    ? LEARNING_INTERVAL_MS
    : (KNOWN_INTERVALS_MS[Math.min(knownCount, KNOWN_INTERVALS_MS.length - 1)] ?? KNOWN_INTERVALS_MS[0]);
  return {
    knownCount: knownCount + (rating === 'known' ? 1 : 0),
    learningCount: learningCount + (rating === 'learning' ? 1 : 0),
    lastResult: rating,
    lastReviewedAt: now.toISOString(),
    dueAt: new Date(now.getTime() + interval).toISOString()
  };
}

export function rateCurrentCard(
  session: StudySession,
  rating: StudyRating,
  previousProgress?: CardProgress
): StudySession {
  if (!session.currentCardId || !session.revealed || session.complete) return session;
  const ratedId = session.currentCardId;
  const snapshot: SessionSnapshot = {
    queue: [...session.queue],
    currentCardId: session.currentCardId,
    revealed: session.revealed,
    results: { ...session.results },
    learningRequeues: { ...session.learningRequeues }
  };
  const nextQueue = [...session.queue];
  const learningRequeues = { ...session.learningRequeues };
  if (rating === 'learning' && (learningRequeues[ratedId] ?? 0) === 0) {
    const insertionIndex = nextQueue.length > 0 ? 1 : 0;
    nextQueue.splice(insertionIndex, 0, ratedId);
    learningRequeues[ratedId] = 1;
  }
  const [currentCardId = null, ...queue] = nextQueue;
  return {
    ...session,
    queue,
    currentCardId,
    revealed: false,
    results: { ...session.results, [rating]: session.results[rating] + 1 },
    learningRequeues,
    history: [...session.history, { snapshot, cardId: ratedId, previousProgress }],
    complete: currentCardId === null
  };
}

export function undoLastRating(session: StudySession): { session: StudySession; entry?: StudyHistoryEntry } {
  const entry = session.history.at(-1);
  if (!entry) return { session };
  return {
    entry,
    session: {
      ...session,
      ...entry.snapshot,
      history: session.history.slice(0, -1),
      complete: false
    }
  };
}
