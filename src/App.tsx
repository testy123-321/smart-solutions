import React, { useEffect, useState } from 'react';
import PlayerScreen from './components/PlayerScreen';
import AdminPanel from './components/AdminPanel';
import { GameProvider } from './context/GameContext';

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setCurrentHash(window.location.hash);
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  if (currentPath === '/admin' || currentHash === '#/admin') {
    return <AdminPanel />;
  }

  return <PlayerScreen />;
}

export default function App() {
  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
