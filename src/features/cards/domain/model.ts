export type CardType = 'word' | 'phrase';

export type BuiltinCardId = `builtin-${string}`;
export type CustomCardId = `custom-${string}`;
export type CardId = BuiltinCardId | CustomCardId;
export type GroupId = `group-${string}`;

export interface CardContent {
  front: string;
  back: string;
  type: CardType;
}

export interface BuiltinCard extends CardContent {
  id: BuiltinCardId;
}

export interface CustomCard extends CardContent {
  id: CustomCardId;
  createdAt: string;
  updatedAt: string;
}

export type Card = BuiltinCard | CustomCard;

export interface CardProgress {
  knownCount: number;
  learningCount: number;
  lastResult: 'known' | 'learning';
  lastReviewedAt: string;
  dueAt: string;
}

export interface Group {
  id: GroupId;
  name: string;
  cardIds: CardId[];
}

export interface UserSettings {
  locale: 'ru';
}

export interface PersistedStateV1 {
  schemaVersion: 1;
  customCards: CustomCard[];
  hiddenBuiltinCardIds: BuiltinCardId[];
  groups: Group[];
  progressByCardId: Partial<Record<CardId, CardProgress>>;
  settings: UserSettings;
}

export type PersistedState = PersistedStateV1;

export const ALL_CARDS_GROUP_ID = 'group-all-cards' as GroupId;

export const createDefaultState = (): PersistedStateV1 => ({
  schemaVersion: 1,
  customCards: [],
  hiddenBuiltinCardIds: [],
  groups: [],
  progressByCardId: {},
  settings: { locale: 'ru' }
});
