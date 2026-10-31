// Login state poori app mein: user, token, login/register/logout.
// Token localStorage mein rehta hai (services/api.js usay har request mein lagata hai).
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/apiServices';
import { TOKEN_KEY } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  // Page refresh par token se user wapas load karo
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return;
    authService
      .getProfile()
      .then((response) => setUser(response.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Token expire ho jaye to axios interceptor ye event bhejta hai
  useEffect(() => {
    const onExpired = () => {
      if (!localStorage.getItem(TOKEN_KEY)) return; // pehle hi logout ho chuka
      clearSession();
      toast.error('Session expired. Please login again.');
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [clearSession, toast]);

  const saveSession = (response) => {
    localStorage.setItem(TOKEN_KEY, response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login: async (credentials) => saveSession(await authService.login(credentials)),
      register: async (formData) => saveSession(await authService.register(formData)),
      logout: () => { clearSession(); toast.success('You have been logged out'); },
      setUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, clearSession, toast]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
