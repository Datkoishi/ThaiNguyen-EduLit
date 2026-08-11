import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api.js';

const AuthContext = createContext(null);

let refreshSessionPromise = null;

const requestSessionRefresh = () => {
  if (!refreshSessionPromise) {
    refreshSessionPromise = apiRequest('/auth/refresh', { method: 'POST' })
      .finally(() => { refreshSessionPromise = null; });
  }
  return refreshSessionPromise;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const payload = await requestSessionRefresh();
      setToken(payload.data.accessToken);
      setUser(payload.data.user);
      return payload.data;
    } catch {
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const payload = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    setToken(payload.data.accessToken);
    setUser(payload.data.user);
    return payload.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', token });
    } finally {
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const updateProfile = useCallback(async (fullName, school) => {
    const payload = await apiRequest('/auth/me', {
      method: 'PATCH',
      token,
      body: { fullName, school: school ?? null }
    });
    setUser(payload.data);
    return payload.data;
  }, [token]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const payload = await apiRequest('/auth/me/password', {
      method: 'PATCH',
      token,
      body: { currentPassword, newPassword }
    });
    setToken(null);
    setUser(null);
    return payload.data;
  }, [token]);

  const value = useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh,
    updateProfile,
    changePassword
  }), [user, token, loading, login, logout, refresh, updateProfile, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
