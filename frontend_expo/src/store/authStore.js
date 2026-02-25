// src/store/authStore.js
// Zustand store for global auth state

import { create } from 'zustand';
import { login, logout, getStoredUser, checkMyStatus } from '../api/authApi';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: true,
  error: null,

  // ── Bootstrap: load persisted user on app start ──────────────
  loadUser: async () => {
    try {
      const user = await getStoredUser();
      if (user) {
        // Re-fetch live status in case admin changed it
        try {
          const fresh = await checkMyStatus();
          set({ user: { ...user, status: fresh.status }, isLoading: false });
        } catch {
          set({ user, isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  // ── Login ──────────────────────────────────────────────────
  login: async (email, password) => {
    set({ error: null });
    try {
      const data = await login(email, password);
      set({ user: { email: data.email, role: data.role, status: data.status, user_id: data.user_id } });
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      set({ error: msg });
      throw err;
    }
  },

  // ── Logout ─────────────────────────────────────────────────
  logout: async () => {
    await logout();
    set({ user: null, error: null });
  },

  // ── Refresh status (for waiting screen polling) ────────────
  refreshStatus: async () => {
    try {
      const fresh = await checkMyStatus();
      set((state) => ({
        user: state.user ? { ...state.user, status: fresh.status } : null
      }));
      return fresh.status;
    } catch {
      return null;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;