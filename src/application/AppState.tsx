import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cards as rawCards } from '../../cards';
import {
  assertValidBuiltinCards,
  createCustomCard,
  deleteCustomCard,
  hideBuiltinCard,
  projectCatalog,
  restoreBuiltinCard,
  updateCustomCard
} from '../features/cards/domain/catalog';
import type {
  BuiltinCard,
  BuiltinCardId,
  Card,
  CardContent,
  CardId,
  CardProgress,
  CardType,
  CustomCardId,
  GroupId,
  PersistedState
} from '../features/cards/domain/model';
import {
  createGroup,
  deleteGroup,
  listGroups,
  renameGroup,
  setGroupMembership,
  type ResolvedGroup
} from '../features/groups/domain/groups';
import { LocalStorageStateRepository, type StateRepository } from '../infrastructure/storage/repository';

const builtinCards = assertValidBuiltinCards(rawCards) as readonly BuiltinCard[];

interface AppContextValue {
  state: PersistedState;
  cards: Card[];
  hiddenCards: BuiltinCard[];
  groups: ResolvedGroup[];
  safeModeReason: string | null;
  unsavedError: string | null;
  addCard(content: { front: string; back: string; type: CardType }): void;
  editCard(id: CustomCardId, content: CardContent): void;
  removeCard(id: CustomCardId): void;
  hideCard(id: BuiltinCardId): void;
  restoreCard(id: BuiltinCardId): void;
  addGroup(name: string): void;
  editGroup(id: GroupId, name: string): void;
  removeGroup(id: GroupId): void;
  setMembership(groupId: GroupId, cardId: CardId, included: boolean): void;
  setProgress(cardId: CardId, progress?: CardProgress): void;
  retrySave(): void;
  resetLocalData(): void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppStateProvider({ children, repository }: { children: ReactNode; repository?: StateRepository }) {
  const repo = useMemo(() => repository ?? new LocalStorageStateRepository(), [repository]);
  const initial = useMemo(() => repo.load(), [repo]);
  const [state, setState] = useState<PersistedState>(initial.state);
  const [safeModeReason, setSafeModeReason] = useState<string | null>(
    initial.status === 'safe-mode' ? initial.reason : null
  );
  const [unsavedError, setUnsavedError] = useState<string | null>(null);

  const persist = useCallback((next: PersistedState) => {
    if (safeModeReason) return;
    setState(next);
    try {
      repo.save(next);
      setUnsavedError(null);
    } catch {
      setUnsavedError('Изменения пока не сохранены. Проверьте доступность хранилища.');
    }
  }, [repo, safeModeReason]);

  const activeCards = useMemo(() => projectCatalog(builtinCards, state), [state]);
  const hiddenCards = useMemo(() => {
    const hidden = new Set(state.hiddenBuiltinCardIds);
    return builtinCards.filter((card) => hidden.has(card.id));
  }, [state.hiddenBuiltinCardIds]);
  const resolvedGroups = useMemo(() => listGroups(state, activeCards), [state, activeCards]);

  const value: AppContextValue = {
    state,
    cards: activeCards,
    hiddenCards,
    groups: resolvedGroups,
    safeModeReason,
    unsavedError,
    addCard: (content) => persist({ ...state, customCards: [...state.customCards, createCustomCard(content)] }),
    editCard: (id, content) => persist({
      ...state,
      customCards: state.customCards.map((card) => card.id === id ? updateCustomCard(card, content) : card)
    }),
    removeCard: (id) => persist(deleteCustomCard(state, id)),
    hideCard: (id) => persist(hideBuiltinCard(state, id)),
    restoreCard: (id) => persist(restoreBuiltinCard(state, id)),
    addGroup: (name) => persist({ ...state, groups: [...state.groups, createGroup(state.groups, name)] }),
    editGroup: (id, name) => persist({ ...state, groups: renameGroup(state.groups, id, name) }),
    removeGroup: (id) => persist({ ...state, groups: deleteGroup(state.groups, id) }),
    setMembership: (groupId, cardId, included) => persist({
      ...state,
      groups: state.groups.map((group) => group.id === groupId ? setGroupMembership(group, cardId, included) : group)
    }),
    setProgress: (cardId, progress) => {
      const progressByCardId = { ...state.progressByCardId };
      if (progress) progressByCardId[cardId] = progress;
      else delete progressByCardId[cardId];
      persist({ ...state, progressByCardId });
    },
    retrySave: () => {
      try {
        repo.save(state);
        setUnsavedError(null);
      } catch {
        setUnsavedError('Изменения всё ещё не сохранены.');
      }
    },
    resetLocalData: () => {
      const clean = repo.reset();
      setState(clean);
      setSafeModeReason(null);
      setUnsavedError(null);
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// The context hook intentionally shares this module with its provider.
// eslint-disable-next-line react-refresh/only-export-components
export function useAppState(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside AppStateProvider');
  return context;
}
