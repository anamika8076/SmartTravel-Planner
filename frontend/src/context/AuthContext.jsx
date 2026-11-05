import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { clearSession, getSession, onSessionExpired, saveSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession());
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    onSessionExpired(() => {
      setUser(null);
      setSessionExpired(true);
    });
    return () => onSessionExpired(null);
  }, []);

  const login = useCallback(async ({ username, password, remember }) => {
    const tokens = await authApi.login({ username, password });
    saveSession({ ...tokens, username }, remember);
    setSessionExpired(false);
    setUser({ username });
  }, []);

  const register = useCallback(({ username, email, password }) => {
    return authApi.register({ username, email, password });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSessionExpired(false);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticated: !!user, sessionExpired, login, register, logout }),
    [user, sessionExpired, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
