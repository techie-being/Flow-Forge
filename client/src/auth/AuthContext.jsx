import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, setSessionExpiredHandler } from "../api/api.js";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export const displayName = (u) => u?.name || u?.username || u?.email || "Account";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  // register/login set cookies; /users/me then gives the canonical user object
  const login = useCallback(async (email, password) => {
    await api.login(email, password);
    setUser(await api.me());
  }, []);
  const register = useCallback(async (email, password) => {
    await api.register(email, password);
    setUser(await api.me());
  }, []);
  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); }
  }, []);
  const reloadUser = useCallback(async () => setUser(await api.me()), []);
  const updateProfile = useCallback(async (fullname, avatar) => {
    setUser(await api.setupAccount(fullname, avatar));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, reloadUser, updateProfile }),
    [user, loading, login, register, logout, reloadUser, updateProfile]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
