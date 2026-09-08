import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppStateProvider } from '../../application/AppState';
import { MemoryStateRepository } from '../../infrastructure/storage/repository';
import { GroupsPage } from './GroupsPage';

describe('GroupsPage', () => {
  it('creates a group, rejects duplicate normalized name, and changes membership', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><AppStateProvider repository={new MemoryStateRepository()}><GroupsPage /></AppStateProvider></MemoryRouter>);
    const input = screen.getByPlaceholderText('Например, Путешествие');
    await user.type(input, 'Фразы');
    await user.click(screen.getByRole('button', { name: 'Создать группу' }));
    const groupButton = screen.getByRole('button', { name: /Фразы/ });
    await user.click(groupButton);
    const panel = screen.getByRole('heading', { name: 'Фразы' }).closest('section');
    expect(panel).not.toBeNull();
    const first = within(panel!).getAllByRole('checkbox')[0];
    await user.click(first!);
    expect(first).toBeChecked();

    await user.type(input, ' фразы ');
    await user.click(screen.getByRole('button', { name: 'Создать группу' }));
    expect(screen.getByRole('alert')).toHaveTextContent('уже существует');
  });
});
