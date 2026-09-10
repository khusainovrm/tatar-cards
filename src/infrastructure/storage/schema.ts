import type {
  BuiltinCardId,
  CardId,
  CardProgress,
  CardType,
  CustomCard,
  Group,
  PersistedStateV1
} from '../../features/cards/domain/model';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const isCardType = (value: unknown): value is CardType => value === 'word' || value === 'phrase';
const isIsoDate = (value: unknown): value is string => isString(value) && !Number.isNaN(Date.parse(value));

function isCustomCard(value: unknown): value is CustomCard {
  return isRecord(value)
    && isString(value.id) && value.id.startsWith('custom-')
    && isString(value.front) && value.front.trim().length > 0
    && isString(value.back) && value.back.trim().length > 0
    && isCardType(value.type)
    && isIsoDate(value.createdAt)
    && isIsoDate(value.updatedAt);
}

function isGroup(value: unknown): value is Group {
  return isRecord(value)
    && isString(value.id) && value.id.startsWith('group-')
    && isString(value.name) && value.name.trim().length > 0
    && isStringArray(value.cardIds);
}

function isProgress(value: unknown): value is CardProgress {
  return isRecord(value)
    && Number.isInteger(value.knownCount) && Number(value.knownCount) >= 0
    && Number.isInteger(value.learningCount) && Number(value.learningCount) >= 0
    && (value.lastResult === 'known' || value.lastResult === 'learning')
    && isIsoDate(value.lastReviewedAt)
    && isIsoDate(value.dueAt);
}

export function isPersistedStateV1(value: unknown): value is PersistedStateV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (!Array.isArray(value.customCards) || !value.customCards.every(isCustomCard)) return false;
  if (!isStringArray(value.hiddenBuiltinCardIds) || !value.hiddenBuiltinCardIds.every((id) => id.startsWith('builtin-'))) return false;
  if (!Array.isArray(value.groups) || !value.groups.every(isGroup)) return false;
  if (!isRecord(value.progressByCardId) || !Object.values(value.progressByCardId).every(isProgress)) return false;
  if (!isRecord(value.settings) || value.settings.locale !== 'ru') return false;
  if (value.starterContentVersion !== undefined && value.starterContentVersion !== 1) return false;
  return true;
}

interface PersistedStateV0 {
  schemaVersion: 0;
  customCards?: CustomCard[];
  hiddenCardIds?: BuiltinCardId[];
  groups?: Group[];
  progress?: Partial<Record<CardId, CardProgress>>;
}

export type Migration = (input: unknown) => unknown;

const migrateV0ToV1: Migration = (input) => {
  if (!isRecord(input) || input.schemaVersion !== 0) return input;
  const old = input as unknown as PersistedStateV0;
  return {
    schemaVersion: 1,
    customCards: old.customCards ?? [],
    hiddenBuiltinCardIds: old.hiddenCardIds ?? [],
    groups: old.groups ?? [],
    progressByCardId: old.progress ?? {},
    settings: { locale: 'ru' }
  } satisfies PersistedStateV1;
};

const migrations: Record<number, Migration> = { 0: migrateV0ToV1 };

export function migrateToCurrent(value: unknown): unknown {
  let current = value;
  while (isRecord(current) && typeof current.schemaVersion === 'number' && current.schemaVersion < 1) {
    const migration = migrations[current.schemaVersion];
    if (!migration) break;
    current = migration(current);
  }
  return current;
}

export function remapBuiltinCardIds(state: PersistedStateV1, mapping: Partial<Record<BuiltinCardId, BuiltinCardId>>): PersistedStateV1 {
  const mapId = (id: CardId): CardId => mapping[id as BuiltinCardId] ?? id;
  const progressByCardId: Partial<Record<CardId, CardProgress>> = {};
  for (const [id, progress] of Object.entries(state.progressByCardId)) {
    progressByCardId[mapId(id as CardId)] = progress;
  }
  return {
    ...state,
    hiddenBuiltinCardIds: [...new Set(state.hiddenBuiltinCardIds.map((id) => mapId(id) as BuiltinCardId))],
    groups: state.groups.map((group) => ({ ...group, cardIds: [...new Set(group.cardIds.map(mapId))] })),
    progressByCardId
  };
}

export function parseAndMigrate(raw: string): PersistedStateV1 {
  const migrated = migrateToCurrent(JSON.parse(raw) as unknown);
  if (!isPersistedStateV1(migrated)) throw new Error('Некорректный или неподдерживаемый формат данных');
  return migrated;
}
