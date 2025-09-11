/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Recipe, StoreCache } from "@/types/store";
import { createCacheKey, deepMerge, debounce } from "@/lib/store";
import { useUserStore } from "./user-store";

interface RecipeState {
  recipes: Recipe[];
  isSyncing: boolean;
  lastSyncTime: string | null;
  _cache: StoreCache;
}

interface RecipeActions {
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt">, token?: string) => void;
  removeRecipe: (recipeId: string, token?: string) => void;
  updateRecipe: (
    recipeId: string,
    updates: Partial<Recipe>,
    token?: string,
  ) => void;
  getRecipe: (recipeId: string) => Recipe | null;
  getSortedRecipes: () => Recipe[];
  syncRecipes: (token?: string) => Promise<void>;
  fetchRecipes: (token?: string) => Promise<void>;
  _invalidateCache: (keys?: string[]) => void;
  _initializeListeners: () => void;
}

type RecipeStore = RecipeState & RecipeActions;

// Debounced sync function
const debouncedSyncRecipes = debounce(
  async (store: RecipeStore, token: string) => {
    await store.syncRecipes(token);
  },
  1000,
);

export const useRecipeStore = create<RecipeStore>()(
  persist(
    immer<RecipeStore>((set, get) => ({
      // State
      recipes: [],
      isSyncing: false,
      lastSyncTime: null,
      _cache: {},

      // Actions
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

      _initializeListeners: () => {
        if (typeof window !== "undefined") {
          const handleUserChange = () => {
            set((state) => {
              state.recipes = [];
              state.lastSyncTime = null;
              state._cache = {};
            });

            const token = useUserStore.getState().getToken();
            if (token) {
              get().fetchRecipes(token);
            }
          };

          const handleUserClear = () => {
            set((state) => {
              state.recipes = [];
              state.isSyncing = false;
              state.lastSyncTime = null;
              state._cache = {};
            });
          };

          window.addEventListener("userChanged", handleUserChange);
          window.addEventListener("userCleared", handleUserClear);

          // Store cleanup function
          (get as any)._cleanup = () => {
            window.removeEventListener("userChanged", handleUserChange);
            window.removeEventListener("userCleared", handleUserClear);
          };
        }
      },

      addRecipe: (recipe, token) => {
        const authToken = token || useUserStore.getState().getToken();
        const newRecipe: Recipe = {
          ...recipe,
          id: `recipe_${Date.now()}_${Math.random()}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => {
          if (!Array.isArray(state.recipes)) {
            state.recipes = [];
          }
          state.recipes.push(newRecipe);
        });

        get()._invalidateCache(["sortedRecipes"]);

        if (authToken) {
          debouncedSyncRecipes(get(), authToken);
        }
      },

      removeRecipe: (recipeId, token) => {
        const authToken = token || useUserStore.getState().getToken();
        if (!authToken) return;

        set((state) => {
          if (!Array.isArray(state.recipes)) {
            state.recipes = [];
            return;
          }
          const recipeIndex = state.recipes.findIndex((r) => r.id === recipeId);
          if (recipeIndex !== -1) {
            state.recipes.splice(recipeIndex, 1);
          }
        });

        get()._invalidateCache(["sortedRecipes"]);

        // Optimistically remove, then sync with server
        const deleteFromAPI = async () => {
          try {
            const { api } = await import("@/lib/api");
            await api.delete(`/recipes/${recipeId}`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            });
          } catch (error) {
            console.error("Failed to delete recipe:", error);
            // Recovery: refetch from server
            get().fetchRecipes(authToken);
          }
        };

        deleteFromAPI();
      },

      updateRecipe: (recipeId, updates, token) => {
        const authToken = token || useUserStore.getState().getToken();

        set((state) => {
          const idx = state.recipes.findIndex((r) => r.id === recipeId);
          if (idx !== -1) {
            state.recipes[idx] = {
              ...state.recipes[idx],
              ...updates,
              lastModified: new Date().toISOString(),
            };
          }
        });

        get()._invalidateCache(["sortedRecipes"]);

        if (authToken) {
          debouncedSyncRecipes(get(), authToken);
        }
      },

      getRecipe: (recipeId) => {
        const state = get();
        return state.recipes.find((r) => r.id === recipeId) || null;
      },

      getSortedRecipes: () => {
        const state = get();
        if (!Array.isArray(state.recipes)) {
          return [];
        }

        const cacheKey = "sortedRecipes";
        const last = state.recipes[state.recipes.length - 1];
        const dataKey = createCacheKey({
          recipesLength: state.recipes.length,
          lastRecipeId: last?.id || null,
          lastRecipeCreatedAt: last?.createdAt || null,
          recipesChecksum: state.recipes.reduce(
            (acc, r) => acc ^ (r?.id?.charCodeAt(0) || 0),
            0,
          ),
        });

        const cached = state._cache[cacheKey];
        if (cached && cached.key === dataKey) {
          return cached.data;
        }

        const sortedRecipes = [...state.recipes].sort((a, b) => {
          const tb = new Date(b?.createdAt || 0).getTime() || 0;
          const ta = new Date(a?.createdAt || 0).getTime() || 0;
          return tb - ta;
        });

        set((s) => {
          s._cache[cacheKey] = {
            data: sortedRecipes,
            key: dataKey,
            timestamp: Date.now(),
          };
        });

        return sortedRecipes;
      },

      syncRecipes: async (token) => {
        const state = get();
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!authToken || !user || state.isSyncing) return;

        set((s) => {
          s.isSyncing = true;
        });

        try {
          const { api } = await import("@/lib/api");
          await api.post(
            "/recipes/sync",
            { recipes: state.recipes },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            },
          );

          set((s) => {
            s.lastSyncTime = new Date().toISOString();
          });
        } catch (error) {
          console.error("Failed to sync recipes:", error);
          // Recovery: fetch canonical server state
          await get().fetchRecipes(authToken);
        } finally {
          set((s) => {
            s.isSyncing = false;
          });
        }
      },

      fetchRecipes: async (token) => {
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!authToken || !user) return;

        try {
          const { api } = await import("@/lib/api");
          const response = await api.get("/recipes", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          const recipes = response.data?.data || [];
          set((s) => {
            s.recipes = Array.isArray(recipes) ? recipes : [];
            s.lastSyncTime = new Date().toISOString();
          });

          get()._invalidateCache(["sortedRecipes"]);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
          set((s) => {
            s.recipes = [];
          });
        }
      },
    })),
    {
      name: "recipe-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        recipes: state.recipes,
        lastSyncTime: state.lastSyncTime,
      }),
      merge: (persistedState: any, currentState: any) =>
        deepMerge(currentState, persistedState),
      version: 1,
    },
  ),
);
