import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { adminApi } from "../api";
import type { AdminUser, AdminProfile } from "../types";

export interface ViewAsRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
}

interface AdminAuthState {
  user: AdminUser | null;
  profile: AdminProfile | null;
  token: string | null;
  loading: boolean;
  profileComplete: boolean;
}

interface AdminAuthContextType extends AdminAuthState {
  login: (token: string, user: AdminUser, profile: AdminProfile) => void;
  logout: () => void;
  updateProfile: (profile: AdminProfile) => void;
  hasPermission: (perm: string) => boolean;
  isOwner: boolean;
  refreshMe: () => Promise<void>;
  viewAsRole: ViewAsRole | null;
  setViewAsRole: (role: ViewAsRole | null) => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    profile: null,
    token: localStorage.getItem("panel_token"),
    loading: true,
    profileComplete: false,
  });
  const [viewAsRole, setViewAsRole] = useState<ViewAsRole | null>(null);

  const refreshMe = useCallback(async () => {
    const token = localStorage.getItem("panel_token");
    if (!token) {
      setState((s) => ({ ...s, loading: false, user: null, profile: null }));
      return;
    }
    try {
      const res = await adminApi.auth.me();
      setState({
        user: res.data.user,
        profile: res.data.profile,
        token,
        loading: false,
        profileComplete: res.data.profile?.profileComplete ?? false,
      });
    } catch {
      localStorage.removeItem("panel_token");
      setState({ user: null, profile: null, token: null, loading: false, profileComplete: false });
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback((token: string, user: AdminUser, profile: AdminProfile) => {
    localStorage.setItem("panel_token", token);
    setState({ user, profile, token, loading: false, profileComplete: profile?.profileComplete ?? false });
  }, []);

  const logout = useCallback(async () => {
    try { await adminApi.auth.logout(); } catch {}
    localStorage.removeItem("panel_token");
    setState({ user: null, profile: null, token: null, loading: false, profileComplete: false });
    setViewAsRole(null);
  }, []);

  const updateProfile = useCallback((profile: AdminProfile) => {
    setState((s) => ({ ...s, profile, profileComplete: profile.profileComplete }));
  }, []);

  const hasPermission = useCallback((perm: string) => {
    if (!state.user) return false;
    if (state.user.isOwner) return true;
    if (viewAsRole) return viewAsRole.permissions.includes(perm);
    return (state.user.permissions || []).includes(perm);
  }, [state.user, viewAsRole]);

  return (
    <AdminAuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        updateProfile,
        hasPermission,
        isOwner: state.user?.isOwner ?? false,
        refreshMe,
        viewAsRole,
        setViewAsRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
