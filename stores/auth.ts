import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '@/types';
import { updateStudentProfileIcon } from '@/lib/auth-service';

const USER_KEY = 'pr_user';
const ONBOARDED_KEY = 'pr_onboarded';

interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  hasSeenOnboarding: boolean;
  initialize: () => Promise<void>;
  setAuth: (user: AuthUser) => Promise<void>;
  setOnboardingComplete: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isInitialized: false,
  hasSeenOnboarding: false,

  initialize: async () => {
    try {
      const [userRaw, onboarded] = await Promise.all([
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(ONBOARDED_KEY),
      ]);
      if (userRaw) {
        const user: AuthUser = JSON.parse(userRaw);
        set({ user, hasSeenOnboarding: onboarded === 'true', isInitialized: true });
      } else {
        set({ hasSeenOnboarding: onboarded === 'true', isInitialized: true });
      }
    } catch {
      set({ isInitialized: true });
    }
  },

  setAuth: async (user) => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch {
      // fall through — store in memory only
    }
    set({ user });
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
    if ('profileIconId' in partial && user.profileIconId !== partial.profileIconId) {
      updateStudentProfileIcon(updated.id, partial.profileIconId ?? null).catch(() => {});
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {}
    // hasSeenOnboarding intentionally NOT reset — re-login skips onboarding
    set({ user: null });
  },
}));
