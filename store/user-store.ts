"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* src/store/userStore.ts */

import React, { useMemo } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export type Plan = "basic" | "pro" | "creator";

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  [key: string]: any;
  name?: string;
  age?: number;
  profileText?: string;
  macros?: NutritionGoals;
}

export interface User {
  id: string;
  email: string;
  plan: Plan;
  profile: UserProfile;
  isNew?: boolean;
}

export interface FoodEntry {
  id: string;
  foodName: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  analysisType: "image" | "text";
  imageUrl?: string;
  analysisData?: any;
  createdAt: string;
}

export type Recipe = any;

export interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  foodEntries: FoodEntry[];
  synced: boolean;
  lastModified: string;
}

interface UserState {
  user: User | null;
  userToken: string | null;
  dailyNutrition: Record<string, DailyNutrition>;
  recipes: Recipe[];
  currentDate: string;
  isSyncing: boolean;
  lastSyncTime: string | null;

  /* Cache for stable references */
  _cache: {
    currentDayNutrition: DailyNutrition | null;
    userGoals: NutritionGoals | null;
    remainingMacros: NutritionGoals | null;
    progressPercentages: NutritionGoals | null;
    sortedRecipes: Recipe[] | null;
    /* Cache keys for validation */
    currentDayKey: string | null;
    userGoalsKey: string | null;
    remainingMacrosKey: string | null;
    progressPercentagesKey: string | null;
    sortedRecipesKey: string | null;
  };

  setUser: (user: User) => void;
  setUserToken: (token: string | null) => void;
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => void;
  updateNutritionGoals: (goals: NutritionGoals) => void;
  clearUser: () => void;
  setCurrentDate: (date: string) => void;
  addFoodEntry: (
    date: string,
    entry: Omit<FoodEntry, "id" | "createdAt">,
    token?: string,
  ) => void;
  removeFoodEntry: (date: string, entryId: string, token?: string) => void;
  updateFoodEntry: (
    date: string,
    entryId: string,
    updates: Partial<FoodEntry>,
    token?: string,
  ) => void;
  syncNutritionData: (token?: string) => Promise<void>;
  fetchDayNutrition: (date: string, token?: string) => Promise<void>;
  calculateAndSaveDailyCalories: (
    date?: string,
    token?: string,
  ) => Promise<void>;

  // Recipe methods
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

  /* Stable computed getters */
  getCurrentDayNutrition: () => DailyNutrition;
  getRemainingMacros: (date?: string) => NutritionGoals;
  getProgressPercentages: (date?: string) => NutritionGoals;
  getUserGoals: () => NutritionGoals;

  /* Cache invalidation helper */
  _invalidateCache: (keys?: string[]) => void;

  /* Internal helper to get token */
  _getToken: () => string | null;
}

/* Helper to create cache keys */
const createCacheKey = (obj: any): string => {
  return JSON.stringify(obj);
};

/* Helper to check if objects are equal */
const isDeepEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const useUserStore = create<UserState>()(
  persist(
    immer<UserState>((set, get) => ({
      /* Initial state */
      user: null,
      userToken: null,
      dailyNutrition: {},
      recipes: [] as Recipe[],
      currentDate: new Date().toISOString().split("T")[0],
      isSyncing: false,
      lastSyncTime: null,
      _cache: {
        currentDayNutrition: null,
        userGoals: null,
        remainingMacros: null,
        progressPercentages: null,
        sortedRecipes: null,
        currentDayKey: null,
        userGoalsKey: null,
        remainingMacrosKey: null,
        progressPercentagesKey: null,
        sortedRecipesKey: null,
      },

      /* Internal helper to get token from various sources */
      _getToken: () => {
        const state = get();
        return (
          state.userToken ||
          (typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null) ||
          (typeof window !== "undefined"
            ? sessionStorage.getItem("authToken")
            : null) ||
          state.user?.profile?.token ||
          null
        );
      },

      _invalidateCache: (keys) => {
        set((state) => {
          if (!keys) {
            /* Invalidate all caches */
            state._cache = {
              currentDayNutrition: null,
              userGoals: null,
              remainingMacros: null,
              progressPercentages: null,
              sortedRecipes: null,
              currentDayKey: null,
              userGoalsKey: null,
              remainingMacrosKey: null,
              progressPercentagesKey: null,
              sortedRecipesKey: null,
            };
          } else {
            keys.forEach((key) => {
              if (key === "currentDayNutrition") {
                state._cache.currentDayNutrition = null;
                state._cache.currentDayKey = null;
              }
              if (key === "userGoals") {
                state._cache.userGoals = null;
                state._cache.userGoalsKey = null;
              }
              if (key === "remainingMacros") {
                state._cache.remainingMacros = null;
                state._cache.remainingMacrosKey = null;
              }
              if (key === "progressPercentages") {
                state._cache.progressPercentages = null;
                state._cache.progressPercentagesKey = null;
              }
              if (key === "sortedRecipes") {
                state._cache.sortedRecipes = null;
                state._cache.sortedRecipesKey = null;
              }
            });
          }
        });
      },

      /* User management */
      setUser: (user) => {
        const currentUser = get().user;
        /* Always clear data if there's no current user or if switching to a different user */
        if (!currentUser || currentUser.id !== user.id) {
          set((state) => {
            state.dailyNutrition = {};
            state.recipes = [];
            state.currentDate = new Date().toISOString().split("T")[0];
            state.lastSyncTime = null;
            state.isSyncing = false;
            state.userToken = null;
          });
        }

        set((state) => {
          state.user = user;
        });
        get()._invalidateCache();
        /* Only fetch data if we have a valid token for the new user */
        const currentDate = get().currentDate;
        const token = get()._getToken();
        if (token && user) {
          get().fetchDayNutrition(currentDate, token);
          get().fetchRecipes(token);
        }
      },

      setUserToken: (token) => {
        set((state) => {
          state.userToken = token;
        });
      },

      updateUserProfile: (profileUpdates) => {
        set((state) => {
          if (state.user) {
            state.user.profile = { ...state.user.profile, ...profileUpdates };
          }
        });
        get()._invalidateCache([
          "userGoals",
          "remainingMacros",
          "progressPercentages",
        ]);
      },

      updateNutritionGoals: (goals) => {
        set((state) => {
          if (state.user) {
            state.user.profile.macros = goals;
          }
        });
        get()._invalidateCache([
          "userGoals",
          "remainingMacros",
          "progressPercentages",
        ]);
      },

      clearUser: () => {
        set((state) => {
          state.user = null;
          state.userToken = null;
          state.dailyNutrition = {};
          state.recipes = [];
          state.currentDate = new Date().toISOString().split("T")[0];
          state.isSyncing = false;
          state.lastSyncTime = null;
        });
        get()._invalidateCache();
        // Also clear tokens from storage to prevent cross-contamination
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
        }
      },

      /* Recipe management */
      addRecipe: (recipe, token) => {
        const authToken = token || get()._getToken();
        console.log(authToken);
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

        // Invalidate sorted recipes cache
        get()._invalidateCache(["sortedRecipes"]);

        if (authToken) {
          setTimeout(() => {
            get().syncRecipes(authToken);
            console.log("done");
          }, 500);
        }
      },

      removeRecipe: (recipeId, token) => {
        const authToken = token || get()._getToken();
        if (!authToken) return;

        // Remove from local state first (optimistic update)
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

        // Invalidate cache
        get()._invalidateCache(["sortedRecipes"]);

        // Make DELETE request to API
        const deleteFromAPI = async () => {
          try {
            const { api } = await import("@/lib/api");
            await api.delete(`/recipes/${recipeId}`, {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            });
            console.log("deleted");
          } catch (error) {
            console.error("Failed to delete recipe:", error);
            // Optionally revert the optimistic update on error
            // get().syncRecipes(authToken);
          }
        };

        deleteFromAPI();
      },
      updateRecipe: (recipeId, updates, token) => {
        const authToken = token || get()._getToken();
        set((state) => {
          const recipeIndex = state.recipes.findIndex((r) => r.id === recipeId);
          if (recipeIndex !== -1) {
            state.recipes[recipeIndex] = {
              ...state.recipes[recipeIndex],
              ...updates,
            };
          }
        });

        get()._invalidateCache(["sortedRecipes"]);

        if (authToken) {
          get().syncRecipes(authToken);
        }
      },

      getRecipe: (recipeId) => {
        const state = get();
        return state.recipes.find((r) => r.id === recipeId) || null;
      },

      // Cached sorted recipes method - THIS FIXES THE INFINITE LOOP
      getSortedRecipes: () => {
        const state = get();

        // Add this safety check
        if (!Array.isArray(state.recipes)) {
          return [];
        }

        const recipesKey = createCacheKey({
          recipesLength: state.recipes.length,
          lastRecipe: state.recipes[state.recipes.length - 1]?.id || null,
        });

        if (
          state._cache.sortedRecipesKey === recipesKey &&
          state._cache.sortedRecipes
        ) {
          return state._cache.sortedRecipes;
        }

        const sortedRecipes = [...state.recipes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        set((state) => {
          state._cache.sortedRecipes = sortedRecipes;
          state._cache.sortedRecipesKey = recipesKey;
        });

        return sortedRecipes;
      },

      syncRecipes: async (token) => {
        const state = get();
        const authToken = token || state._getToken();

        if (!authToken || !state.user) return;

        try {
          const { api } = await import("@/lib/api");
          await api.post(
            "/recipes/sync",
            {
              recipes: state.recipes,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            },
          );
        } catch (error) {
          console.error("Failed to sync recipes:", error);
        }
      },

      fetchRecipes: async (token) => {
        const state = get();
        const authToken = token || state._getToken();

        if (!authToken || !state.user) return;

        try {
          const { api } = await import("@/lib/api");
          const response = await api.get("/recipes", {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          const recipes = response.data.data || [];
          set((state) => {
            state.recipes = recipes;
          });

          get()._invalidateCache(["sortedRecipes"]);
        } catch (error) {
          console.error("Failed to fetch recipes:", error);
          set((state) => {
            state.recipes = [];
          });
        }
      },

      /* Nutrition tracking - keeping all existing logic */
      setCurrentDate: (date) => {
        set((state) => {
          state.currentDate = date;
        });
        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
        if (!get().dailyNutrition[date]) {
          const token = get()._getToken();
          get().fetchDayNutrition(date, token as string);
        }
      },

      calculateAndSaveDailyCalories: async (date, token) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const authToken = token || state._getToken();

        if (!dayData || !state.user) return;

        const calculatedTotals = dayData.foodEntries.reduce(
          (acc, entry) => {
            acc.calories += Number(entry.calories);
            acc.protein += Number(entry.protein);
            acc.carbs += Number(entry.carbs);
            acc.fat += Number(entry.fat);
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );

        set((state) => {
          if (state.dailyNutrition[targetDate]) {
            state.dailyNutrition[targetDate].totalCalories =
              calculatedTotals.calories;
            state.dailyNutrition[targetDate].totalProtein =
              calculatedTotals.protein;
            state.dailyNutrition[targetDate].totalCarbs =
              calculatedTotals.carbs;
            state.dailyNutrition[targetDate].totalFat = calculatedTotals.fat;
            state.dailyNutrition[targetDate].synced = false;
            state.dailyNutrition[targetDate].lastModified =
              new Date().toISOString();
          }
        });

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);

        if (authToken) {
          try {
            const { api } = await import("@/lib/api");
            const response = await api.post(
              "/meals/sync",
              {
                date: targetDate,
                totalMacros: calculatedTotals,
                foodEntries: dayData.foodEntries,
              },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${authToken}`,
                },
              },
            );

            set((state) => {
              if (state.dailyNutrition[targetDate]) {
                state.dailyNutrition[targetDate].synced = true;
                state.dailyNutrition[targetDate].lastModified =
                  response.data.data?.lastModified || new Date().toISOString();
              }
            });
          } catch (error) {
            console.error(
              `Failed to save daily calories for ${targetDate}:`,
              error,
            );
          }
        }
      },

      addFoodEntry: (date, entry, token) => {
        const authToken = token || get()._getToken();

        set((state) => {
          if (!state.dailyNutrition[date]) {
            state.dailyNutrition[date] = {
              date,
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              foodEntries: [],
              synced: false,
              lastModified: new Date().toISOString(),
            };
          }

          const newEntry: FoodEntry = {
            ...entry,
            id: `temp_${Date.now()}_${Math.random()}`,
            createdAt: new Date().toISOString(),
          };

          state.dailyNutrition[date].foodEntries.push(newEntry);
          state.dailyNutrition[date].totalCalories += Number(entry.calories);
          state.dailyNutrition[date].totalProtein += Number(entry.protein);
          state.dailyNutrition[date].totalCarbs += Number(entry.carbs);
          state.dailyNutrition[date].totalFat += Number(entry.fat);
          state.dailyNutrition[date].synced = false;
          state.dailyNutrition[date].lastModified = new Date().toISOString();
        });

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
        setTimeout(() => get().syncNutritionData(authToken as string), 1500);
      },

      removeFoodEntry: (date, entryId, token) => {
        const authToken = token || get()._getToken();

        set((state) => {
          const dayData = state.dailyNutrition[date];
          if (!dayData) return;

          const entryIndex = dayData.foodEntries.findIndex(
            (e: any) => e.id === entryId,
          );
          if (entryIndex === -1) return;

          const entry = dayData.foodEntries[entryIndex];
          dayData.totalCalories -= Number(entry.calories);
          dayData.totalProtein -= Number(entry.protein);
          dayData.totalCarbs -= Number(entry.carbs);
          dayData.totalFat -= Number(entry.fat);

          dayData.foodEntries.splice(entryIndex, 1);
          dayData.synced = false;
          dayData.lastModified = new Date().toISOString();
        });

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
        get().syncNutritionData(authToken as string);
      },

      updateFoodEntry: (date, entryId, updates, token) => {
        const authToken = token || get()._getToken();

        set((state) => {
          const dayData = state.dailyNutrition[date];
          if (!dayData) return;

          const entryIndex = dayData.foodEntries.findIndex(
            (e: any) => e.id === entryId,
          );
          if (entryIndex === -1) return;

          const oldEntry = dayData.foodEntries[entryIndex];
          const newEntry = { ...oldEntry, ...updates };

          dayData.totalCalories =
            dayData.totalCalories -
            Number(oldEntry.calories) +
            Number(newEntry.calories);
          dayData.totalProtein =
            dayData.totalProtein -
            Number(oldEntry.protein) +
            Number(newEntry.protein);
          dayData.totalCarbs =
            dayData.totalCarbs -
            Number(oldEntry.carbs) +
            Number(newEntry.carbs);
          dayData.totalFat =
            dayData.totalFat - Number(oldEntry.fat) + Number(newEntry.fat);

          dayData.foodEntries[entryIndex] = newEntry;
          dayData.synced = false;
          dayData.lastModified = new Date().toISOString();
        });

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
        get().syncNutritionData(authToken as string);
      },

      syncNutritionData: async (token) => {
        const state = get();
        const authToken = token || state._getToken();

        if (state.isSyncing || !state.user) return;

        set((state) => {
          state.isSyncing = true;
        });

        try {
          const { api } = await import("@/lib/api");
          const unsyncedDays = Object.entries(state.dailyNutrition)
            .filter(([, dayData]) => !dayData.synced)
            .map(([date, dayData]) => ({ date, dayData }));

          for (const { date, dayData } of unsyncedDays) {
            console.log("date is", date);
            try {
              const response = await api.post(
                "/meals/sync",
                {
                  date,
                  totalMacros: {
                    calories: dayData.totalCalories,
                    protein: dayData.totalProtein,
                    carbs: dayData.totalCarbs,
                    fat: dayData.totalFat,
                  },
                  foodEntries: dayData.foodEntries,
                },
                {
                  headers: {
                    "Content-Type": "application/json",
                    ...(authToken && { Authorization: `Bearer ${authToken}` }),
                  },
                },
              );

              set((state) => {
                if (state.dailyNutrition[date]) {
                  state.dailyNutrition[date].synced = true;
                  state.dailyNutrition[date].lastModified =
                    response.data.data?.lastModified ||
                    new Date().toISOString();
                  if (response.data.data?.foodEntries) {
                    state.dailyNutrition[date].foodEntries =
                      response.data.data.foodEntries;
                  }
                }
              });
            } catch (error) {
              console.error(
                `Failed to sync nutrition data for ${date}:`,
                error,
              );
              set((state) => {
                if (state.dailyNutrition[date]) {
                  state.dailyNutrition[date].synced = false;
                }
              });
            }
          }

          set((state) => {
            state.lastSyncTime = new Date().toISOString();
          });
        } catch (error) {
          console.error("Sync nutrition data error:", error);
        } finally {
          set((state) => {
            state.isSyncing = false;
          });
        }

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
      },

      fetchDayNutrition: async (date, token) => {
        const state = get();
        const authToken = token || state._getToken();

        if (!state.user) return;

        try {
          const { api } = await import("@/lib/api");
          const response = await api.get(`/meals/day/${date}`, {
            headers: {
              "Content-Type": "application/json",
              ...(authToken && { Authorization: `Bearer ${authToken}` }),
            },
          });

          const data = response.data.data;

          set((state) => {
            state.dailyNutrition[date] = {
              date,
              totalCalories: data.totalMacros?.calories || 0,
              totalProtein: data.totalMacros?.protein || 0,
              totalCarbs: data.totalMacros?.carbs || 0,
              totalFat: data.totalMacros?.fat || 0,
              foodEntries: data.foodEntries || [],
              synced: true,
              lastModified: data.lastModified || new Date().toISOString(),
            };
          });
        } catch (error) {
          console.error(`Failed to fetch nutrition data for ${date}:`, error);
          set((state) => {
            if (!state.dailyNutrition[date]) {
              state.dailyNutrition[date] = {
                date,
                totalCalories: 0,
                totalProtein: 0,
                totalCarbs: 0,
                totalFat: 0,
                foodEntries: [],
                synced: true,
                lastModified: new Date().toISOString(),
              };
            }
          });
        }

        get()._invalidateCache([
          "currentDayNutrition",
          "remainingMacros",
          "progressPercentages",
        ]);
      },

      /* STABLE COMPUTED GETTERS WITH CACHING */
      getCurrentDayNutrition: () => {
        const state = get();
        const { currentDate, dailyNutrition, _cache } = state;

        const currentKey = createCacheKey({
          currentDate,
          hasData: !!dailyNutrition[currentDate],
          lastModified: dailyNutrition[currentDate]?.lastModified,
        });

        /* Return cached value if key matches */
        if (_cache.currentDayKey === currentKey && _cache.currentDayNutrition) {
          return _cache.currentDayNutrition;
        }

        const newValue = dailyNutrition[currentDate] || {
          date: currentDate,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          foodEntries: [],
          synced: true,
          lastModified: new Date().toISOString(),
        };

        /* Cache the new value */
        set((state) => {
          state._cache.currentDayNutrition = newValue;
          state._cache.currentDayKey = currentKey;
        });

        return newValue;
      },

      getUserGoals: () => {
        const state = get();
        const userKey = createCacheKey(state.user?.profile?.macros);

        if (state._cache.userGoalsKey === userKey && state._cache.userGoals) {
          return state._cache.userGoals;
        }

        const newValue = state.user?.profile?.macros || {
          calories: 2000,
          protein: 150,
          carbs: 200,
          fat: 80,
        };

        set((state) => {
          state._cache.userGoals = newValue;
          state._cache.userGoalsKey = userKey;
        });

        return newValue;
      },

      getRemainingMacros: (date) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const goals = state.getUserGoals();

        const cacheKey = createCacheKey({
          targetDate,
          dayData: dayData && {
            totalCalories: dayData.totalCalories,
            totalProtein: dayData.totalProtein,
            totalCarbs: dayData.totalCarbs,
            totalFat: dayData.totalFat,
          },
          goals,
        });

        if (
          state._cache.remainingMacrosKey === cacheKey &&
          state._cache.remainingMacros
        ) {
          return state._cache.remainingMacros;
        }

        const newValue = !dayData
          ? goals
          : {
              calories: Math.max(0, goals.calories - dayData.totalCalories),
              protein: Math.max(0, goals.protein - dayData.totalProtein),
              carbs: Math.max(0, goals.carbs - dayData.totalCarbs),
              fat: Math.max(0, goals.fat - dayData.totalFat),
            };

        set((state) => {
          state._cache.remainingMacros = newValue;
          state._cache.remainingMacrosKey = cacheKey;
        });

        return newValue;
      },

      getProgressPercentages: (date) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const goals = state.getUserGoals();

        const cacheKey = createCacheKey({
          targetDate,
          dayData: dayData && {
            totalCalories: dayData.totalCalories,
            totalProtein: dayData.totalProtein,
            totalCarbs: dayData.totalCarbs,
            totalFat: dayData.totalFat,
          },
          goals,
        });

        if (
          state._cache.progressPercentagesKey === cacheKey &&
          state._cache.progressPercentages
        ) {
          return state._cache.progressPercentages;
        }

        const newValue = !dayData
          ? { calories: 0, protein: 0, carbs: 0, fat: 0 }
          : {
              calories: Math.round(
                (dayData.totalCalories / goals.calories) * 100,
              ),
              protein: Math.round((dayData.totalProtein / goals.protein) * 100),
              carbs: Math.round((dayData.totalCarbs / goals.carbs) * 100),
              fat: Math.round((dayData.totalFat / goals.fat) * 100),
            };

        set((state) => {
          state._cache.progressPercentages = newValue;
          state._cache.progressPercentagesKey = cacheKey;
        });

        return newValue;
      },
    })),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        userToken: state.userToken,
        dailyNutrition: state.dailyNutrition,
        recipes: state.recipes,
        currentDate: state.currentDate,
        lastSyncTime: state.lastSyncTime,
        /* Don't persist cache */
      }),
    },
  ),
);

/* Simple utility hooks without memoization (the store handles stability now) */
export const useHydrateUserStore = () => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    useUserStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
};

export const useCurrentUser = () => useUserStore((state) => state.user);
export const useNutritionGoals = () =>
  useUserStore((state) => state.getUserGoals());
export const useCurrentDayNutrition = () =>
  useUserStore((state) => state.getCurrentDayNutrition());
export const useRemainingMacros = () =>
  useUserStore((state) => state.getRemainingMacros());
export const useProgressPercentages = () =>
  useUserStore((state) => state.getProgressPercentages());

// Fixed recipe hooks - use cached method to prevent infinite loops
export const useRecipes = () => {
  const recipes = useUserStore((state) => state.recipes || []);

  return useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    return [...recipes].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [recipes]);
};
export const useRecipeById = (recipeId: string) =>
  useUserStore((state) => state.getRecipe(recipeId));
export const useAddRecipe = () => useUserStore((state) => state.addRecipe);
export const useRemoveRecipe = () =>
  useUserStore((state) => state.removeRecipe);
export const useUpdateRecipe = () =>
  useUserStore((state) => state.updateRecipe);

export const useSetUserToken = () =>
  useUserStore((state) => state.setUserToken);
