import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "";
const TOKEN_KEY = "rbstars_customer_token";

export interface CustomerUser {
  _id: string;
  email: string;
  displayName: string;
  robloxUsername: string;
  robloxAvatarUrl: string | null;
  emailVerified: boolean;
}

type AuthModalMode = "login" | "register";

interface AuthContextValue {
  user: CustomerUser | null;
  token: string | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuthModal: (mode?: AuthModalMode, onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<{ requiresVerification: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (data: Partial<CustomerUser>) => void;
  onSuccessCallback: React.MutableRefObject<(() => void) | null>;
}

interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  robloxUsername: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>("login");
  const onSuccessCallback = useRef<(() => void) | null>(null);

  const apiFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(`${BACKEND}/api/customer-auth${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  }, [token]);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) { setLoading(false); return; }
    try {
      const res = await fetch(`${BACKEND}/api/customer-auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.customer);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      }
    } catch {

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshUser(); }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: {},
    });
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.customer);
  }, [apiFetch]);

  const register = useCallback(async (payload: RegisterData) => {
    const data = await fetch(`${BACKEND}/api/customer-auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.message); return d; });

    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.customer);
    return { requiresVerification: data.requiresVerification };
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updates: Partial<CustomerUser>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const openAuthModal = useCallback((mode: AuthModalMode = "login", onSuccess?: () => void) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    if (onSuccess) onSuccessCallback.current = onSuccess;
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    onSuccessCallback.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      authModalOpen, authModalMode,
      openAuthModal, closeAuthModal,
      login, register, logout, refreshUser, updateUser,
      onSuccessCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
