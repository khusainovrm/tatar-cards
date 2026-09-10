import { describe, expect, it } from 'vitest';
import { starterGroups, validateStarterCourse } from './course';
import { createDefaultState } from '../src/features/cards/domain/model';

describe('A1 starter course', () => {
  it('contains exactly 1,000 distinct phrase cards in 20 groups and includes every legacy phrase', () => {
    expect(validateStarterCourse).not.toThrow();
    expect(starterGroups.flatMap((group) => group.cardIds)).toHaveLength(1000);
  });

  it('gives new users independent editable copies of every group', () => {
    const state = createDefaultState();
    expect(state.groups).toHaveLength(20);
    state.groups[0]!.cardIds.pop();
    expect(createDefaultState().groups[0]!.cardIds).toHaveLength(50);
  });
});
