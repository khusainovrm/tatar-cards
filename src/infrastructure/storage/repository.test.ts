import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultState, type BuiltinCardId, type PersistedStateV1 } from '../../features/cards/domain/model';
import { LocalStorageStateRepository, STORAGE_KEY } from './repository';
import { parseAndMigrate, remapBuiltinCardIds } from './schema';
import { stateV0Fixture } from './fixtures/state-v0';

describe('local state repository', () => {
  beforeEach(() => localStorage.clear());

  it('restores the last saved state after reload', () => {
    const repository = new LocalStorageStateRepository(localStorage);
    const state = { ...createDefaultState(), hiddenBuiltinCardIds: ['builtin-one' as BuiltinCardId] };
    repository.save(state);
    expect(new LocalStorageStateRepository(localStorage).load()).toMatchObject({ status: 'ready', state });
  });

  it('migrates supported version zero data', () => {
    const migrated = parseAndMigrate(JSON.stringify(stateV0Fixture));
    expect(migrated).toMatchObject({ schemaVersion: 1, hiddenBuiltinCardIds: ['builtin-one'], settings: { locale: 'ru' } });
  });

  it('adds starter groups to existing data once without replacing user content or progress', () => {
    const state = createDefaultState();
    delete state.starterContentVersion;
    state.groups = [{ id: 'group-personal', name: 'Мои фразы', cardIds: ['builtin-phrase-001'] }];
    state.hiddenBuiltinCardIds = ['builtin-phrase-002'];
    state.customCards = [{ id: 'custom-own', front: 'Мин монда.', back: 'Я здесь.', type: 'phrase', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }];
    state.progressByCardId = { 'builtin-phrase-001': { knownCount: 2, learningCount: 1, lastResult: 'known', lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt: '2026-01-02T00:00:00.000Z' } };
    const repo = new LocalStorageStateRepository(localStorage);
    repo.save(state);
    const loaded = repo.load().state;
    expect(loaded.groups).toHaveLength(21);
    expect(loaded.groups[0]).toEqual(state.groups[0]);
    expect(loaded.customCards).toEqual(state.customCards);
    expect(loaded.hiddenBuiltinCardIds).toEqual(state.hiddenBuiltinCardIds);
    expect(loaded.progressByCardId).toEqual(state.progressByCardId);
    loaded.groups = loaded.groups.filter((group) => group.id !== 'group-a1-greetings');
    loaded.groups[1]!.name = 'Моё название';
    repo.save(loaded);
    expect(repo.load().state).toEqual(loaded);
  });

  it('remaps card identifiers in visibility, groups, and progress', () => {
    const oldId = 'builtin-old' as BuiltinCardId;
    const newId = 'builtin-new' as BuiltinCardId;
    const item = { knownCount: 1, learningCount: 0, lastResult: 'known' as const, lastReviewedAt: '2026-01-01T00:00:00.000Z', dueAt: '2026-01-02T00:00:00.000Z' };
    const state: PersistedStateV1 = { ...createDefaultState(), hiddenBuiltinCardIds: [oldId], groups: [{ id: 'group-one', name: 'One', cardIds: [oldId] }], progressByCardId: { [oldId]: item } };
    expect(remapBuiltinCardIds(state, { [oldId]: newId })).toMatchObject({ hiddenBuiltinCardIds: [newId], groups: [{ cardIds: [newId] }], progressByCardId: { [newId]: item } });
  });

  it('preserves malformed and newer raw values in safe mode', () => {
    for (const raw of ['not-json', JSON.stringify({ ...createDefaultState(), schemaVersion: 99 })]) {
      localStorage.setItem(STORAGE_KEY, raw);
      const loaded = new LocalStorageStateRepository(localStorage).load();
      expect(loaded).toMatchObject({ status: 'safe-mode', raw });
      expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    }
  });

  it('requires explicit reset and reports rejected writes to callers', () => {
    localStorage.setItem(STORAGE_KEY, 'broken');
    const repository = new LocalStorageStateRepository(localStorage);
    expect(repository.load().status).toBe('safe-mode');
    expect(repository.reset()).toEqual(createDefaultState());
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    const storage = { ...localStorage, getItem: vi.fn(() => null), setItem: vi.fn(() => { throw new DOMException('quota', 'QuotaExceededError'); }), removeItem: vi.fn() } as unknown as Storage;
    expect(() => new LocalStorageStateRepository(storage).save(createDefaultState())).toThrow('quota');
  });
});
