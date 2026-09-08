import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { cards } from '../../../cards';
import { AppStateProvider } from '../../application/AppState';
import { createDefaultState } from '../../features/cards/domain/model';
import { MemoryStateRepository } from '../../infrastructure/storage/repository';
import { StudyPage } from './StudyPage';

function renderStudy(cardCount = 2) {
  const selected = cards.slice(0, cardCount);
  const state = {
    ...createDefaultState(),
    groups: [{ id: 'group-test' as const, name: 'Тест', cardIds: selected.map((card) => card.id) }]
  };
  return render(
    <MemoryRouter initialEntries={['/study/group-test']}>
      <AppStateProvider repository={new MemoryStateRepository(state)}>
        <Routes><Route path="/study/:groupId" element={<StudyPage />} /></Routes>
      </AppStateProvider>
    </MemoryRouter>
  );
}

describe('StudyPage', () => {
  it('gates ratings until reveal and supports equivalent button control', async () => {
    const user = userEvent.setup();
    renderStudy(2);
    expect(screen.getByRole('button', { name: /Знаю/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Показать перевод' }));
    expect(screen.getByRole('button', { name: /Знаю/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /Знаю/ }));
    expect(screen.getByText('1 осталось')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Отменить' }));
    expect(screen.getByText('2 осталось')).toBeInTheDocument();
  });

  it('snaps back below threshold and accepts right swipe above threshold', async () => {
    const user = userEvent.setup();
    renderStudy(2);
    await user.click(screen.getByRole('button', { name: 'Показать перевод' }));
    const card = screen.getByText(cards[0]!.front).closest('section')!;
    fireEvent.pointerDown(card, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(card, { pointerId: 1, clientX: 110 });
    fireEvent.pointerUp(card, { pointerId: 1, clientX: 110 });
    expect(screen.getByText(cards[0]!.front)).toBeInTheDocument();
    fireEvent.pointerDown(card, { pointerId: 2, clientX: 100 });
    fireEvent.pointerMove(card, { pointerId: 2, clientX: 190 });
    fireEvent.pointerUp(card, { pointerId: 2, clientX: 190 });
    expect(screen.getByText('1 осталось')).toBeInTheDocument();
  });

  it('supports keyboard reveal and learning rating', async () => {
    const user = userEvent.setup();
    renderStudy(2);
    await user.keyboard(' ');
    expect(screen.getByText(cards[0]!.back)).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Отменить' })).toBeEnabled();
  });
});
