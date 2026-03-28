import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '@/types';

const TOKEN_KEY = 'pr_token';
const USER_KEY = 'pr_user';
const ONBOARDED_KEY = 'pr_onboarded';

const BYPASS_USER: AuthUser = {
  id: 'dev-bypass-001',
  username: 'dev_student',
  fullName: 'Dev Student',
  classId: undefined,
  className: 'Section Dev',
  avatarSeed: 'D',
  createdAt: new Date().toISOString(),
};

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  isBypass: boolean;
  hasSeenOnboarding: boolean;
  initialize: () => Promise<void>;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  setBypass: () => void;
  setOnboardingComplete: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isInitialized: false,
  isBypass: false,
  hasSeenOnboarding: false,

  initialize: async () => {
    try {
      const [token, userRaw, onboarded] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(ONBOARDED_KEY),
      ]);
      if (token && userRaw) {
        const user: AuthUser = JSON.parse(userRaw);
        set({ token, user, hasSeenOnboarding: onboarded === 'true', isInitialized: true });
      } else {
        set({ hasSeenOnboarding: onboarded === 'true', isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  setAuth: async (token, user) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, token),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
    } catch {
      // fall through — store in memory only
    }
    set({ token, user, isBypass: false });
  },

  setBypass: () => {
    set({ token: 'bypass', user: BYPASS_USER, isBypass: true });
  },

  setOnboardingComplete: async () => {
    try {
      await SecureStore.setItemAsync(ONBOARDED_KEY, 'true');
    } catch {}
    set({ hasSeenOnboarding: true });
  },

  updateUser: (partial) => {
    const { user } = get();
    if (!user) return;
    const updated = { ...user, ...partial };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated)).catch(() => {});
  },

  logout: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch {}
    // hasSeenOnboarding intentionally NOT reset — re-login skips onboarding
    set({ token: null, user: null, isBypass: false });
  },
}));
