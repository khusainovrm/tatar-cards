import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppStateProvider } from '../../application/AppState';
import { MemoryStateRepository } from '../../infrastructure/storage/repository';
import { CatalogPage } from './CatalogPage';

function renderPage() {
  return render(<MemoryRouter><AppStateProvider repository={new MemoryStateRepository()}><CatalogPage /></AppStateProvider></MemoryRouter>);
}

describe('CatalogPage', () => {
  it('validates and creates a custom card', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Заполните');
    await user.type(screen.getByLabelText('Татарский текст'), 'сәлам');
    await user.type(screen.getByLabelText('Русский перевод'), 'привет');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    expect(screen.getByText('сәлам')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
  });

  it('hides and restores a built-in card', async () => {
    const user = userEvent.setup();
    renderPage();
    const firstHide = screen.getAllByRole('button', { name: 'Скрыть' })[0];
    expect(firstHide).toBeDefined();
    await user.click(firstHide!);
    expect(screen.getByRole('button', { name: 'Вернуть' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Вернуть' }));
    expect(screen.queryByRole('button', { name: 'Вернуть' })).not.toBeInTheDocument();
  });

  it('deletes a custom card after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Татарский текст'), 'сүз');
    await user.type(screen.getByLabelText('Русский перевод'), 'слово');
    await user.click(screen.getByRole('button', { name: 'Добавить' }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(screen.queryByText('сүз')).not.toBeInTheDocument();
  });
});
