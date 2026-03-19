import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

export function useAuth() {
  const navigate = useNavigate();

  const isAuthenticated = !!localStorage.getItem('token');

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authService.login(email, password);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    },
    [navigate]
  );

  const register = useCallback(
    async (companyName: string, email: string, password: string, name?: string) => {
      const res = await authService.register(companyName, email, password, name);
      localStorage.setItem('token', res.data.token);
      navigate('/');
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    toast.success('Sessão encerrada');
    navigate('/login');
  }, [navigate]);

  return { isAuthenticated, login, register, logout };
}
