import type { LoginRequest, LoginResponse, User } from '../types/auth';
import { apiFetch } from './apiClient';

const API_URL = 'http://localhost:8080/api/auth';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, clave: credentials.clave })
    });
    if (!response.ok) {
      throw new Error(response.status === 401 ? 'Correo o contraseña incorrectos.' : 'No se pudo conectar con la autenticación de SQL Server.');
    }
    const data: LoginResponse = await response.json();
    localStorage.setItem('aisell_token', data.token);
    localStorage.setItem('aisell_user', JSON.stringify(data.usuario));
    return data;
  },
  logout: (): void => {
    localStorage.removeItem('aisell_token');
    localStorage.removeItem('aisell_user');
  },
  getCurrentUser: (): User | null => {
    const token = localStorage.getItem('aisell_token');
    const guardado = localStorage.getItem('aisell_user');
    if (!token || !token.startsWith('eyJ') || !guardado) return null;
    try {
      return JSON.parse(guardado) as User;
    } catch {
      return null;
    }
  },
  verificarSesion: async (): Promise<User | null> => {
    if (!authService.getCurrentUser()) return null;
    const respuesta = await apiFetch(`${API_URL}/me`);
    if (!respuesta.ok) return null;
    const usuario: User = await respuesta.json();
    localStorage.setItem('aisell_user', JSON.stringify(usuario));
    return usuario;
  },
  actualizarPerfil: async (nombre: string, email: string): Promise<User> => {
    const respuesta = await apiFetch(`${API_URL}/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email })
    });
    if (!respuesta.ok) throw new Error('No se pudo actualizar el perfil en SQL Server.');
    const usuario: User = await respuesta.json();
    localStorage.setItem('aisell_user', JSON.stringify(usuario));
    return usuario;
  }
};
