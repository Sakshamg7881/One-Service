/**
 * OneService – Auth Store (Zustand)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "vendor" | "admin";
  avatar?: string;
  isVerified: boolean;
  location?: { coordinates: [number, number]; address: string };
  fcmToken?: string;

  preferences?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    [key: string]: boolean | undefined;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...updates } });
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) await api.post("/auth/logout", { refreshToken });
        } catch (_) {}
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        window.location.href = "/auth/login";
      },

      initialize: () => {
        // Sync from localStorage on mount
        const token = localStorage.getItem("accessToken");
        const refresh = localStorage.getItem("refreshToken");
        const state = get();
        if (token && refresh && state.user) {
          set({ accessToken: token, refreshToken: refresh, isAuthenticated: true });
        }
      },
    }),
    {
      name: "oneservice-auth",
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
