import type { BuiltinCard, BuiltinCardId, Group, PersistedState } from '../src/features/cards/domain/model';
import { legacyCards } from '../legacy-cards';
import { a1Topics } from './a1';

// Preserve IDs of all pre-existing phrases (including their saved progress).
const imported = (id: string): BuiltinCardId => `builtin-imported-${id}`;
const existingByTopic: Record<string, BuiltinCardId[]> = {
  greetings: [imported('48f2c6dc-9642-413c-87a9-bdcf9ba82e49'), imported('150dcf61-6e37-4f70-9e51-9c50b4d0e20f'), 'builtin-phrase-001', 'builtin-phrase-002', 'builtin-phrase-003', 'builtin-phrase-004'],
  introductions: ['builtin-phrase-005'],
  family: ['aa7ed2d5-0ad5-4824-8b7d-aa8c69c0b8f8', '36e1816b-f4ca-4dd1-84fd-a5368ecd1566', '9326a9f0-889f-4ee8-8f81-c8e39a0143b1', '23d25686-a8ec-47b9-9d26-053a2c985f36', 'ffce315a-f4ba-4e27-a599-89e85c23060f', '4a24415b-b877-49bf-9883-52399f241697'].map(imported),
  home: ['b6a9c991-611a-41b0-b275-d851a4f9651d', 'd0ec3a02-9b60-4b66-a6f2-eaca6637436d'].map(imported),
  routine: ['7b1f051e-3de0-4e3b-aa2f-7073bd14f019', '2e53c0ba-bd35-4102-afb0-6c367d31a65e', '74a4930c-6d64-4342-b705-cf499092efb5'].map(imported),
  food: ['fe9200c9-e85d-4e21-8691-f74eca7ada92', 'e3cf7a52-93a3-42d9-b7cb-b6a11a25f284', '9410e66b-4c87-44b4-92a1-d376649fc4c7', '16f26dcc-2a29-46b3-a726-4d0a2b53ce80', '83a43b47-440f-44e4-84f2-a8cc78a70f87', 'dca7a0fc-0dce-4dc0-8525-4bfd154c51d6', '76bc78be-fa15-4a2a-b293-4c9f1c7e1a89', '139cc6ba-8867-4571-89a7-f081bd5da9ea', 'debf4e9c-a9a8-4177-8a81-f838ad8d55eb', '5b678c39-9375-4c94-9bfa-26b4ee5b1d1e'].map(imported),
  language: [imported('b2722f2f-1706-40f9-a3f8-523e21c189d4'), 'builtin-phrase-006'],
  leisure: ['63d2ee88-d001-421e-af7e-a5764f2cfe7a', '2e516123-9375-4eee-963c-cc350b9bc6ed', '61a19e76-15f3-49d4-a595-e15c781dc875'].map(imported),
  phone: [imported('00d54b3e-5882-44a8-96dc-56b7b6372fd1')],
  help: ['f8a21015-a15e-4512-8dfd-5bf4f708fb06', '81a784ab-dd90-4ef9-a33f-393fac5534b3', '78ddb444-43fd-4bca-a8e9-1931d31da414', '7a934982-9f5c-4511-867d-8ee0dcc4c26e', '2db96b26-bbc8-454b-992c-42ff642cb731', 'd7d9596d-e97f-4143-91d4-ecc5f3965768', '15089259-5269-4ec4-b9e0-fe4c8f3e8486', '99bdaec2-1041-4c90-8b96-1c7d92a48104'].map(imported)
};

export const newA1Cards: BuiltinCard[] = a1Topics.flatMap((topic) => topic.phrases.trim().split('\n').map((line, index) => {
  const parts = line.split('|');
  const front = parts[0]?.trim();
  const back = parts[1]?.trim();
  if (parts.length !== 2 || !front || !back) throw new Error(`Invalid phrase: ${topic.slug}:${index + 1}`);
  return { id: `builtin-a1-${topic.slug}-${String(index + 1).padStart(3, '0')}`, front, back, type: 'phrase' };
}));

export const starterGroups: Group[] = a1Topics.map((topic) => ({
  id: `group-a1-${topic.slug}`,
  name: `А1 · ${topic.name}`,
  cardIds: [...(existingByTopic[topic.slug] ?? []), ...newA1Cards.filter((card) => card.id.startsWith(`builtin-a1-${topic.slug}-`)).map((card) => card.id)]
}));

export function seedStarterGroups(state: PersistedState): PersistedState {
  if (state.starterContentVersion === 1) return state;
  const groups = [...state.groups];
  const names = new Set(groups.map((group) => group.name.trim().toLocaleLowerCase('ru')));
  for (const starter of starterGroups) {
    if (groups.some((group) => group.id === starter.id)) continue;
    let name = starter.name;
    let suffix = 2;
    while (names.has(name.toLocaleLowerCase('ru'))) name = `${starter.name} (${suffix++})`;
    names.add(name.toLocaleLowerCase('ru'));
    groups.push({ ...starter, name, cardIds: [...starter.cardIds] });
  }
  return { ...state, groups, starterContentVersion: 1 };
}

export function validateStarterCourse(): void {
  if (starterGroups.length !== 20) throw new Error('Expected 20 A1 groups');
  const catalog = new Map<string, BuiltinCard>([...legacyCards, ...newA1Cards].map((card) => [card.id, card]));
  const assigned = new Set<string>();
  const texts = new Set<string>();
  for (const group of starterGroups) {
    if (group.cardIds.length !== 50) throw new Error(`${group.name}: expected 50 phrases, got ${group.cardIds.length}`);
    for (const id of group.cardIds) {
      if (catalog.get(id)?.type !== 'phrase') throw new Error(`Missing phrase ${id}`);
      if (assigned.has(id)) throw new Error(`Phrase assigned twice: ${id}`);
      const text = catalog.get(id)!.front.toLocaleLowerCase('tt').replace(/[.!?,]/g, '').trim();
      if (texts.has(text)) throw new Error(`Duplicate phrase text: ${text}`);
      texts.add(text);
      assigned.add(id);
    }
  }
  for (const card of legacyCards.filter((card) => card.type === 'phrase')) {
    if (!assigned.has(card.id)) throw new Error(`Unassigned existing phrase ${card.id}`);
  }
}
