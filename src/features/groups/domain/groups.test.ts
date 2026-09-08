import { describe, expect, it } from 'vitest';
import { createDefaultState, ALL_CARDS_GROUP_ID, type BuiltinCard } from '../../cards/domain/model';
import { createGroup, deleteGroup, listGroups, renameGroup, resolveEligibleCardIds, setGroupMembership } from './groups';

const card: BuiltinCard = { id: 'builtin-one', front: 'сәлам', back: 'привет', type: 'word' };

describe('groups domain', () => {
  it('normalizes names and rejects duplicates', () => {
    const one = createGroup([], '  Слова  ', 'one');
    expect(one.name).toBe('Слова');
    expect(() => createGroup([one], 'слова', 'two')).toThrow('уже существует');
    expect(() => renameGroup([one, { id: 'group-two', name: 'Фразы', cardIds: [] }], 'group-two', ' СЛОВА ')).toThrow('уже существует');
  });

  it('supports membership without duplicates and preserves card identity', () => {
    const group = createGroup([], 'Слова', 'one');
    const included = setGroupMembership(setGroupMembership(group, card.id, true), card.id, true);
    expect(included.cardIds).toEqual([card.id]);
    expect(setGroupMembership(included, card.id, false).cardIds).toEqual([]);
  });

  it('builds dynamic All Cards and filters stale references', () => {
    const state = { ...createDefaultState(), groups: [{ id: 'group-one' as const, name: 'One', cardIds: [card.id, 'builtin-missing' as const, card.id] }] };
    const groups = listGroups(state, [card]);
    expect(groups[0]).toMatchObject({ id: ALL_CARDS_GROUP_ID, cardIds: [card.id], system: true });
    expect(groups[1]?.cardIds).toEqual([card.id]);
  });

  it('protects system group and rejects an empty resolved group', () => {
    expect(() => deleteGroup([], ALL_CARDS_GROUP_ID)).toThrow('нельзя удалить');
    expect(() => resolveEligibleCardIds({ id: 'group-empty', name: 'Empty', cardIds: [], system: false })).toThrow('нет карточек');
  });
});
