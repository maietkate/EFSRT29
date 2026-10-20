import WatsonWidget from './components/WatsonWidget';

import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RepartidorDashboard from './pages/RepartidorDashboard';
import { authService } from './services/authService';
import type { User } from './types/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let activo = true;
    authService.verificarSesion().then((usuario) => {
      if (activo) setUser(usuario);
    }).catch(() => {
      if (activo) setUser(null);
    });
    const vencida = () => {
      authService.logout();
      setUser(null);
    };
    window.addEventListener('aisell-sesion-expirada', vencida);
    return () => {
      activo = false;
      window.removeEventListener('aisell-sesion-expirada', vencida);
    };
  }, []);

  const handleLoginSuccess = () => {
    setUser(authService.getCurrentUser());
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (user.rol === 'REPARTIDOR') {
    return <><RepartidorDashboard onLogout={handleLogout} /><WatsonWidget /></>;
  }

  return <><Dashboard onLogout={handleLogout} /><WatsonWidget /></>;
}
