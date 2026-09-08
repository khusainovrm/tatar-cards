import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppStateProvider, useAppState } from './AppState';
import { createDefaultState, type PersistedState } from '../features/cards/domain/model';
import type { LoadResult, StateRepository } from '../infrastructure/storage/repository';

class FailingRepository implements StateRepository {
  load(): LoadResult { return { status: 'ready', state: createDefaultState(), migrated: false }; }
  save(): void { throw new DOMException('quota', 'QuotaExceededError'); }
  reset(): PersistedState { return createDefaultState(); }
}

function Probe() {
  const { addGroup, unsavedError } = useAppState();
  return <><button onClick={() => addGroup('Тест')}>change</button>{unsavedError && <div role="alert">{unsavedError}</div>}</>;
}

describe('AppStateProvider', () => {
  it('keeps in-memory state and exposes an error when saving fails', async () => {
    const user = userEvent.setup();
    render(<AppStateProvider repository={new FailingRepository()}><Probe /></AppStateProvider>);
    await user.click(screen.getByRole('button', { name: 'change' }));
    expect(screen.getByRole('alert')).toHaveTextContent('не сохранены');
  });
});
