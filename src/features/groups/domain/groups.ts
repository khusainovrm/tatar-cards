import { ALL_CARDS_GROUP_ID, type Card, type CardId, type Group, type GroupId, type PersistedState } from '../../cards/domain/model';

export interface ResolvedGroup {
  id: GroupId;
  name: string;
  cardIds: CardId[];
  system: boolean;
}

export function normalizeGroupName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru');
}

function assertUniqueGroupName(groups: readonly Group[], name: string, exceptId?: GroupId): string {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) throw new Error('Название группы обязательно');
  const normalized = normalizeGroupName(trimmed);
  if (groups.some((group) => group.id !== exceptId && normalizeGroupName(group.name) === normalized)) {
    throw new Error('Группа с таким названием уже существует');
  }
  if (normalizeGroupName('Все карточки') === normalized || normalizeGroupName('All Cards') === normalized) {
    throw new Error('Это название зарезервировано');
  }
  return trimmed;
}

export function createGroup(groups: readonly Group[], name: string, id: string = crypto.randomUUID()): Group {
  return { id: `group-${id}`, name: assertUniqueGroupName(groups, name), cardIds: [] };
}

export function renameGroup(groups: readonly Group[], groupId: GroupId, name: string): Group[] {
  const nextName = assertUniqueGroupName(groups, name, groupId);
  return groups.map((group) => (group.id === groupId ? { ...group, name: nextName } : group));
}

export function deleteGroup(groups: readonly Group[], groupId: GroupId): Group[] {
  if (groupId === ALL_CARDS_GROUP_ID) throw new Error('Системную группу нельзя удалить');
  return groups.filter((group) => group.id !== groupId);
}

export function setGroupMembership(group: Group, cardId: CardId, included: boolean): Group {
  const ids = new Set(group.cardIds);
  if (included) ids.add(cardId);
  else ids.delete(cardId);
  return { ...group, cardIds: [...ids] };
}

export function listGroups(state: PersistedState, activeCards: readonly Card[]): ResolvedGroup[] {
  const activeIds = new Set(activeCards.map((card) => card.id));
  const allCards: ResolvedGroup = {
    id: ALL_CARDS_GROUP_ID,
    name: 'Все карточки',
    cardIds: [...activeIds],
    system: true
  };
  return [
    allCards,
    ...state.groups.map((group) => ({
      ...group,
      cardIds: [...new Set(group.cardIds.filter((id) => activeIds.has(id)))],
      system: false
    }))
  ];
}

export function resolveEligibleCardIds(group: ResolvedGroup): CardId[] {
  if (group.cardIds.length === 0) throw new Error('В группе нет карточек для изучения');
  return [...new Set(group.cardIds)];
}
