import type { BuiltinCard, BuiltinCardId, Card, CardId, CardType, CustomCard, PersistedState } from './model';

export interface CardValidationIssue {
  index: number;
  message: string;
}

export function validateBuiltinCards(input: readonly BuiltinCard[]): CardValidationIssue[] {
  const issues: CardValidationIssue[] = [];
  const ids = new Set<string>();

  input.forEach((card, index) => {
    if (!card.id.startsWith('builtin-')) issues.push({ index, message: 'id must start with builtin-' });
    if (ids.has(card.id)) issues.push({ index, message: `duplicate id: ${card.id}` });
    ids.add(card.id);
    if (!card.front.trim()) issues.push({ index, message: 'front is empty' });
    if (!card.back.trim()) issues.push({ index, message: 'back is empty' });
    if (card.type !== 'word' && card.type !== 'phrase') issues.push({ index, message: 'unsupported type' });
  });

  return issues;
}

export function assertValidBuiltinCards(input: readonly BuiltinCard[]): readonly BuiltinCard[] {
  const issues = validateBuiltinCards(input);
  if (issues.length > 0) {
    throw new Error(`Invalid built-in cards:\n${issues.map((issue) => `[${issue.index}] ${issue.message}`).join('\n')}`);
  }
  return input;
}

export function projectCatalog(builtin: readonly BuiltinCard[], state: PersistedState): Card[] {
  const hidden = new Set(state.hiddenBuiltinCardIds);
  return [...builtin.filter((card) => !hidden.has(card.id)), ...state.customCards];
}

export function createCustomCard(
  content: { front: string; back: string; type: CardType },
  id: string = crypto.randomUUID(),
  now = new Date()
): CustomCard {
  const front = content.front.trim();
  const back = content.back.trim();
  if (!front || !back) throw new Error('Обе стороны карточки обязательны');
  const timestamp = now.toISOString();
  return { id: `custom-${id}`, front, back, type: content.type, createdAt: timestamp, updatedAt: timestamp };
}

export function updateCustomCard(card: CustomCard, content: CardContentInput, now = new Date()): CustomCard {
  const front = content.front.trim();
  const back = content.back.trim();
  if (!front || !back) throw new Error('Обе стороны карточки обязательны');
  return { ...card, ...content, front, back, updatedAt: now.toISOString() };
}

type CardContentInput = { front: string; back: string; type: CardType };

export function deleteCustomCard(state: PersistedState, cardId: CardId): PersistedState {
  const progressByCardId = { ...state.progressByCardId };
  delete progressByCardId[cardId];
  return {
    ...state,
    customCards: state.customCards.filter((card) => card.id !== cardId),
    groups: state.groups.map((group) => ({ ...group, cardIds: group.cardIds.filter((id) => id !== cardId) })),
    progressByCardId
  };
}

export function hideBuiltinCard(state: PersistedState, cardId: BuiltinCardId): PersistedState {
  return state.hiddenBuiltinCardIds.includes(cardId)
    ? state
    : { ...state, hiddenBuiltinCardIds: [...state.hiddenBuiltinCardIds, cardId] };
}

export function restoreBuiltinCard(state: PersistedState, cardId: BuiltinCardId): PersistedState {
  return { ...state, hiddenBuiltinCardIds: state.hiddenBuiltinCardIds.filter((id) => id !== cardId) };
}
