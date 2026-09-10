import { createDefaultState, type PersistedState } from '../../features/cards/domain/model';
import { parseAndMigrate } from './schema';
import { seedStarterGroups } from '../../../content/course';

export const STORAGE_KEY = 'tatar-cards:user-state';

export type LoadResult =
  | { status: 'ready'; state: PersistedState; migrated: boolean }
  | { status: 'safe-mode'; state: PersistedState; raw: string; reason: string };

export interface StateRepository {
  load(): LoadResult;
  save(state: PersistedState): void;
  reset(): PersistedState;
}

export class LocalStorageStateRepository implements StateRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  load(): LoadResult {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (raw === null) return { status: 'ready', state: createDefaultState(), migrated: false };
    try {
      const originalVersion = (JSON.parse(raw) as { schemaVersion?: unknown }).schemaVersion;
      const parsed = parseAndMigrate(raw);
      const state = seedStarterGroups(parsed);
      return { status: 'ready', state, migrated: originalVersion !== state.schemaVersion || state !== parsed };
    } catch (error) {
      return {
        status: 'safe-mode',
        state: createDefaultState(),
        raw,
        reason: error instanceof Error ? error.message : 'Не удалось прочитать данные'
      };
    }
  }

  save(state: PersistedState): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  reset(): PersistedState {
    this.storage.removeItem(STORAGE_KEY);
    return createDefaultState();
  }
}

export class MemoryStateRepository implements StateRepository {
  private state: PersistedState;

  constructor(initial: PersistedState = createDefaultState()) {
    this.state = structuredClone(initial);
  }

  load(): LoadResult {
    return { status: 'ready', state: structuredClone(this.state), migrated: false };
  }

  save(state: PersistedState): void {
    this.state = structuredClone(state);
  }

  reset(): PersistedState {
    this.state = createDefaultState();
    return structuredClone(this.state);
  }
}
