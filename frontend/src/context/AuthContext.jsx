import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { TOKEN_KEY } from '../api/client';
import { authApi } from '../api/endpoints';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session on page load.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setLoading(false);
      return;
    }
    authApi.me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  /** Call with a successful AuthResponse ({ accessToken, user }). */
  const completeLogin = useCallback((auth) => {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    setUser(auth.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, completeLogin, logout }),
    [user, loading, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Where each role lands after signing in. */
export const HOME_BY_ROLE = {
  DRIVER: '/dashboard',
  STATION_OWNER: '/dashboard',
  ADMIN: '/admin/users',
};

export const ROLE_LABEL = {
  DRIVER: 'EV Driver',
  STATION_OWNER: 'Station Owner',
  ADMIN: 'Admin',
};
