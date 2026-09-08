import type { BuiltinCardId } from '../../../features/cards/domain/model';

export const stateV0Fixture = {
  schemaVersion: 0,
  customCards: [],
  hiddenCardIds: ['builtin-one' as BuiltinCardId],
  groups: [],
  progress: {}
};
