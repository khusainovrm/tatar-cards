import { describe, expect, it } from 'vitest';
import type { CardId, CardProgress } from '../../cards/domain/model';
import { createStudySession, progressAfterRating, rateCurrentCard, revealAnswer, skipMissingCards, undoLastRating } from './session';

const a = 'builtin-a' as CardId;
const b = 'builtin-b' as CardId;
const c = 'builtin-c' as CardId;
const now = new Date('2026-01-10T12:00:00.000Z');
const progress = (dueAt: string): CardProgress => ({ knownCount: 1, learningCount: 0, lastResult: 'known', lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt });

describe('study session domain', () => {
  it('deduplicates and orders due, unseen, then not-due cards', () => {
    const session = createStudySession([c, b, a, a], { [a]: progress('2026-01-01T00:00:00.000Z'), [c]: progress('2026-02-01T00:00:00.000Z') }, now);
    expect([session.currentCardId, ...session.queue]).toEqual([a, b, c]);
  });

  it('allows rating before reveal and reinserts learning after another card once', () => {
    const initial = createStudySession([a, b, c], {}, now);
    const rated = rateCurrentCard(initial, 'learning');
    expect([rated.currentCardId, ...rated.queue]).toEqual([b, a, c]);
    const second = rateCurrentCard(rated, 'known');
    const repeated = rateCurrentCard(second, 'learning');
    expect([repeated.currentCardId, ...repeated.queue]).toEqual([c]);
  });

  it('calculates review intervals and exact undo state', () => {
    const initial = revealAnswer(createStudySession([a, b], {}, now));
    const nextProgress = progressAfterRating(undefined, 'known', now);
    expect(nextProgress.dueAt).toBe('2026-01-11T12:00:00.000Z');
    const rated = rateCurrentCard(initial, 'known', undefined);
    const undone = undoLastRating(rated);
    expect(undone.entry).toMatchObject({ cardId: a, previousProgress: undefined });
    expect(undone.session.currentCardId).toBe(a);
    expect(undone.session.revealed).toBe(true);
  });

  it('skips missing current and queued cards', () => {
    const session = createStudySession([a, b, c], {}, now);
    const next = skipMissingCards(session, new Set([c]));
    expect(next.currentCardId).toBe(c);
    expect(next.queue).toEqual([]);
  });

  it('completes and reports result totals', () => {
    const session = rateCurrentCard(revealAnswer(createStudySession([a], {}, now)), 'known');
    expect(session.complete).toBe(true);
    expect(session.results).toEqual({ known: 1, learning: 0 });
  });
});
