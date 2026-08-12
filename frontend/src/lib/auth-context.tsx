import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User, UserRole, AccessLevel, Module, RolePermission } from "../types";
import { login as storeLogin, getRolePermissions } from "./store";

interface AuthState {
  user: User | null;
  permissions: RolePermission[];
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasAccess: (module: Module) => AccessLevel;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "transitops_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    permissions: [],
    loading: true,
  });

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const restore = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const user: User = JSON.parse(stored);
          const permissions = await getRolePermissions();
          setState({ user, permissions, loading: false });
        } else {
          setState((s) => ({ ...s, loading: false }));
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setState({ user: null, permissions: [], loading: false });
      }
    };
    restore();
  }, []);

  const login = async (email: string, password: string) => {
    const user = await storeLogin(email, password);
    const permissions = await getRolePermissions();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setState({ user, permissions, loading: false });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ user: null, permissions: [], loading: false });
  };

  const hasAccess = (module: Module): AccessLevel => {
    if (!state.user) return "none";
    const perm = state.permissions.find(
      (p) => p.role === state.user!.role && p.module === module
    );
    return perm?.access ?? "none";
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
