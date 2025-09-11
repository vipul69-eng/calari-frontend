"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { User, UserProfile, NutritionGoals, StoreCache } from "@/types/store";
import {
  createCacheKey,
  deepMerge,
  getAuthToken,
  clearAuthTokens,
} from "@/lib/store";

interface UserState {
  user: User | null;
  userToken: string | null;
  isLoading: boolean;
  lastSyncTime: string | null;
  _cache: StoreCache;
}

interface UserActions {
  setUser: (user: User) => void;
  setUserToken: (token: string | null) => void;
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => void;
  updateNutritionGoals: (goals: NutritionGoals) => void;
  clearUser: () => void;
  getUserGoals: () => NutritionGoals;
  getToken: () => string | null;
  _invalidateCache: (keys?: string[]) => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    immer<UserStore>((set, get) => ({
      // State
      user: null,
      userToken: null,
      isLoading: false,
      lastSyncTime: null,
      _cache: {},

      // Actions
      getToken: () => {
        const state = get();
        return (
          state.userToken ||
          getAuthToken() ||
          state.user?.profile?.token ||
          null
        );
      },

      _invalidateCache: (keys) => {
        set((state) => {
          if (!keys) {
            state._cache = {};
          } else {
            keys.forEach((key) => {
              delete state._cache[key];
            });
          }
        });
      },

      setUser: (user) => {
        const currentUser = get().user;
        const isNewUser = !currentUser || currentUser.id !== user.id;

        set((state) => {
          state.user = user;
          if (isNewUser) {
            state.lastSyncTime = null;
            state._cache = {};
          }
        });

        if (isNewUser) {
          // Notify other stores about user change
          window.dispatchEvent(
            new CustomEvent("userChanged", { detail: user }),
          );
        }
      },

      setUserToken: (token) => {
        set((state) => {
          state.userToken = token;
        });

        if (token) {
          localStorage.setItem("authToken", token);
        } else {
          clearAuthTokens();
        }
      },

      updateUserProfile: (profileUpdates) => {
        set((state) => {
          if (state.user) {
            state.user.profile = { ...state.user.profile, ...profileUpdates };
          }
        });
        get()._invalidateCache(["userGoals"]);

        // Notify other stores about profile change
        window.dispatchEvent(
          new CustomEvent("userProfileChanged", {
            detail: profileUpdates,
          }),
        );
      },

      updateNutritionGoals: (goals) => {
        set((state) => {
          if (state.user) {
            state.user.profile.macros = goals;
          }
        });
        get()._invalidateCache(["userGoals"]);

        // Notify other stores about goals change
        window.dispatchEvent(
          new CustomEvent("nutritionGoalsChanged", {
            detail: goals,
          }),
        );
      },

      clearUser: () => {
        set((state) => {
          state.user = null;
          state.userToken = null;
          state.isLoading = false;
          state.lastSyncTime = null;
          state._cache = {};
        });

        clearAuthTokens();

        // Notify other stores about user clear
        window.dispatchEvent(new CustomEvent("userCleared"));
      },

      getUserGoals: () => {
        const state = get();
        const cacheKey = "userGoals";
        const userKey = createCacheKey(state.user?.profile?.macros || {});

        const cached = state._cache[cacheKey];
        if (cached && cached.key === userKey) {
          return cached.data;
        }

        const goals = state.user?.profile?.macros || {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 80,
        };

        set((s) => {
          s._cache[cacheKey] = {
            data: goals,
            key: userKey,
            timestamp: Date.now(),
          };
        });

        return goals;
      },
    })),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        userToken: state.userToken,
        lastSyncTime: state.lastSyncTime,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      merge: (persistedState: any, currentState: any) =>
        deepMerge(currentState, persistedState),
      version: 1,
    },
  ),
);
