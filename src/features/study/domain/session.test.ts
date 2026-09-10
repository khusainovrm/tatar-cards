import { describe, expect, it } from 'vitest';
import type { CardId, CardProgress } from '../../cards/domain/model';
import { createStudySession, progressAfterRating, rateCurrentCard, revealAnswer, skipMissingCards, undoLastRating, type StudySession } from './session';

const a = 'builtin-a' as CardId;
const b = 'builtin-b' as CardId;
const c = 'builtin-c' as CardId;
const now = new Date('2026-01-10T12:00:00.000Z');
const keepOrder = () => 0.999;
const progress = (dueAt: string): CardProgress => ({ knownCount: 1, learningCount: 0, lastResult: 'known', lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt });

describe('study session domain', () => {
  it('deduplicates and orders unseen, due, then not-due cards', () => {
    const session = createStudySession([c, b, a, a], { [a]: progress('2026-01-01T00:00:00.000Z'), [c]: progress('2026-02-01T00:00:00.000Z') }, now, keepOrder);
    expect([session.currentCardId, ...session.queue]).toEqual([b, a, c]);
  });

  it('shuffles cards on session creation', () => {
    const original = [a, b, c];
    const unchanged = createStudySession(original, {}, now, keepOrder);
    const shuffled = createStudySession(original, {}, now, () => 0);
    expect([unchanged.currentCardId, ...unchanged.queue]).toEqual([a, b, c]);
    expect([shuffled.currentCardId, ...shuffled.queue]).not.toEqual([a, b, c]);
  });

  it('shows all unseen session cards and waits ten steps before repeating learning', () => {
    const ids = Array.from({ length: 11 }, (_, index) => `builtin-${index}` as CardId);
    const initial = createStudySession(ids, {}, now, keepOrder);
    const rated = rateCurrentCard(initial, 'learning');
    expect([rated.currentCardId, ...rated.queue]).toEqual([...ids.slice(1), ids[0]]);
    const afterTenSteps = Array.from({ length: 10 }).reduce<StudySession>(
      (session) => rateCurrentCard(session, 'known'),
      rated
    );
    expect(afterTenSteps.currentCardId).toBe(ids[0]);
  });

  it('does not repeat a learning card when fewer than ten steps remain', () => {
    const initial = createStudySession([a, b, c], {}, now, keepOrder);
    const rated = rateCurrentCard(initial, 'learning');
    expect([rated.currentCardId, ...rated.queue]).toEqual([b, c]);
  });

  it('calculates review intervals and exact undo state', () => {
    const initial = revealAnswer(createStudySession([a, b], {}, now, keepOrder));
    const nextProgress = progressAfterRating(undefined, 'known', now);
    expect(nextProgress.dueAt).toBe('2026-01-11T12:00:00.000Z');
    const rated = rateCurrentCard(initial, 'known', undefined);
    const undone = undoLastRating(rated);
    expect(undone.entry).toMatchObject({ cardId: a, previousProgress: undefined });
    expect(undone.session.currentCardId).toBe(a);
    expect(undone.session.revealed).toBe(true);
  });

  it('skips missing current and queued cards', () => {
    const session = createStudySession([a, b, c], {}, now, keepOrder);
    const next = skipMissingCards(session, new Set([c]));
    expect(next.currentCardId).toBe(c);
    expect(next.queue).toEqual([]);
  });

  it('completes and reports result totals', () => {
    const session = rateCurrentCard(revealAnswer(createStudySession([a], {}, now, keepOrder)), 'known');
    expect(session.complete).toBe(true);
    expect(session.results).toEqual({ known: 1, learning: 0 });
  });
});
