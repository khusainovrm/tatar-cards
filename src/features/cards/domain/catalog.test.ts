import { describe, expect, it } from 'vitest';
import type { BuiltinCard, PersistedStateV1 } from './model';
import { createDefaultState } from './model';
import {
  createCustomCard,
  deleteCustomCard,
  hideBuiltinCard,
  projectCatalog,
  restoreBuiltinCard,
  updateCustomCard,
  validateBuiltinCards
} from './catalog';

const builtin: BuiltinCard = { id: 'builtin-one', front: 'сәлам', back: 'привет', type: 'word' };

describe('card catalog domain', () => {
  it('reports duplicate identifiers and empty sides', () => {
    const invalid = [builtin, { ...builtin, front: '' }];
    expect(validateBuiltinCards(invalid)).toEqual([
      { index: 1, message: 'duplicate id: builtin-one' },
      { index: 1, message: 'front is empty' }
    ]);
  });

  it('creates and updates trimmed custom cards in a separate id namespace', () => {
    const card = createCustomCard({ front: '  рәхмәт ', back: ' спасибо ', type: 'word' }, 'fixed', new Date('2026-01-01'));
    expect(card).toMatchObject({ id: 'custom-fixed', front: 'рәхмәт', back: 'спасибо' });
    expect(updateCustomCard(card, { front: ' сәлам ', back: ' привет ', type: 'word' }, new Date('2026-01-02'))).toMatchObject({ front: 'сәлам', back: 'привет', updatedAt: '2026-01-02T00:00:00.000Z' });
    expect(() => createCustomCard({ front: ' ', back: 'перевод', type: 'word' })).toThrow('обязательны');
  });

  it('projects active cards and restores a hidden card with progress intact', () => {
    const progress = { knownCount: 1, learningCount: 0, lastResult: 'known' as const, lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt: '2026-01-02T00:00:00.000Z' };
    const initial: PersistedStateV1 = { ...createDefaultState(), progressByCardId: { [builtin.id]: progress } };
    const hidden = hideBuiltinCard(initial, builtin.id);
    expect(projectCatalog([builtin], hidden)).toEqual([]);
    const restored = restoreBuiltinCard(hidden, builtin.id);
    expect(projectCatalog([builtin], restored)).toEqual([builtin]);
    expect(restored.progressByCardId[builtin.id]).toEqual(progress);
  });

  it('deletes custom card references and progress atomically', () => {
    const card = createCustomCard({ front: 'сүз', back: 'слово', type: 'word' }, 'fixed', new Date('2026-01-01'));
    const state: PersistedStateV1 = {
      ...createDefaultState(),
      customCards: [card],
      groups: [{ id: 'group-one', name: 'One', cardIds: [card.id] }],
      progressByCardId: { [card.id]: { knownCount: 0, learningCount: 1, lastResult: 'learning', lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt: '2026-01-01T00:10:00.000Z' } }
    };
    expect(deleteCustomCard(state, card.id)).toMatchObject({ customCards: [], groups: [{ cardIds: [] }], progressByCardId: {} });
  });
});
