import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLocation } from 'react-router-dom';

export function UpdatePrompt() {
  const location = useLocation();
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  if (!needRefresh) return null;
  const studying = location.pathname.startsWith('/study/');
  return (
    <aside className="update-toast" role="status">
      <p><strong>Доступно обновление.</strong> {studying ? 'Завершите занятие, затем обновите приложение.' : 'Можно установить новую версию.'}</p>
      {!studying && <button className="button primary" type="button" onClick={() => void updateServiceWorker(true)}>Обновить</button>}
    </aside>
  );
}
