/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import {
  DailyNutrition,
  FoodEntry,
  MealHistoryEntry,
  NutritionAnalytics,
  NutritionGoals,
  StoreCache,
} from "@/types/store";
import { createCacheKey, deepMerge, debounce, isCacheValid } from "@/lib/store";
import { useUserStore } from "./user-store";

interface NutritionState {
  dailyNutrition: Record<string, DailyNutrition>;
  currentDate: string;
  isSyncing: boolean;
  mealHistory: MealHistoryEntry[];
  nutritionAnalytics: NutritionAnalytics | null;
  isLoadingHistory: boolean;
  isLoadingAnalytics: boolean;
  streak: number;
  _cache: StoreCache;
}

interface NutritionActions {
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
  getCurrentDayNutrition: () => DailyNutrition;
  getRemainingMacros: (date?: string) => NutritionGoals;
  getProgressPercentages: (date?: string) => NutritionGoals;
  fetchMealHistory: (
    params?: {
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
    token?: string,
  ) => Promise<void>;
  fetchNutritionAnalytics: (days?: number, token?: string) => Promise<void>;
  getMealHistory: () => MealHistoryEntry[];
  getNutritionAnalytics: () => NutritionAnalytics | null;
  clearAnalyticsData: () => void;
  _invalidateCache: (keys?: string[]) => void;
  _initializeListeners: () => void;
  calculateStreak: () => void;
}

type NutritionStore = NutritionState & NutritionActions;

// Track in-flight sync operations
const inFlightDays = new Set<string>();

export const useNutritionStore = create<NutritionStore>()(
  persist(
    immer<NutritionStore>((set, get) => ({
      // State
      dailyNutrition: {},
      currentDate: new Date().toISOString().split("T")[0],
      isSyncing: false,
      mealHistory: [],
      nutritionAnalytics: null,
      isLoadingHistory: false,
      isLoadingAnalytics: false,
      streak: 0,
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
      calculateStreak: () => {
        console.log("calculating streak...");
        const state = get();
        const today = new Date(state.currentDate);
        let streak = 0;

        const mealDates = new Set(
          state.mealHistory.map(
            (m) => new Date(m.date).toISOString().split("T")[0],
          ),
        );

        const checkDate = new Date(today);

        // If today has no log, start from yesterday
        if (!mealDates.has(checkDate.toISOString().split("T")[0])) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const dayStr = checkDate.toISOString().split("T")[0];
          if (mealDates.has(dayStr)) {
            streak += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        set((s) => {
          s.streak = streak;
        });

        return streak;
      },
      fetchMealHistory: async (params = {}, token) => {
        const cacheKey = `mealHistory_${JSON.stringify(params)}`;
        const state = get();

        // ✅ Check cache first
        if (isCacheValid(state._cache, cacheKey)) {
          set((s) => {
            s.mealHistory = state._cache[cacheKey].data;
          });
          get().calculateStreak();

          return;
        }
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!user || !authToken) return;

        set((state) => {
          state.isLoadingHistory = true;
        });

        try {
          const { api } = await import("@/lib/api");

          // Build query parameters
          const queryParams = new URLSearchParams();
          if (params.startDate)
            queryParams.append("startDate", params.startDate);
          if (params.endDate) queryParams.append("endDate", params.endDate);
          if (params.limit)
            queryParams.append("limit", params.limit.toString());
          const response = await api.get(`/meals/history?${queryParams}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          const historyData = response.data?.data || [];

          set((state) => {
            state.mealHistory = historyData;
            state.isLoadingHistory = false;
          });

          get().calculateStreak();

          // Cache the result
          const cacheKey = `mealHistory_${JSON.stringify(params)}`;
          set((s) => {
            s._cache[cacheKey] = {
              data: historyData,
              key: createCacheKey(params),
              timestamp: Date.now(),
            };
          });
        } catch (error) {
          console.error("Failed to fetch meal history:", error);
          set((state) => {
            state.isLoadingHistory = false;
            state.mealHistory = [];
          });
        }
      },

      fetchNutritionAnalytics: async (days = 7, token) => {
        const cacheKey = `nutritionAnalytics_${days}`;
        const state = get();

        if (isCacheValid(state._cache, cacheKey)) {
          set((s) => {
            s.nutritionAnalytics = state._cache[cacheKey].data;
            s.isLoadingAnalytics = false;
          });
          return;
        }

        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!user || !authToken) return;

        set((state) => {
          state.isLoadingAnalytics = true;
        });

        try {
          const { api } = await import("@/lib/api");

          const response = await api.get(`/meals/analytics?days=${days}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          const analyticsData = response.data?.data || null;

          set((state) => {
            state.nutritionAnalytics = analyticsData;
            state.isLoadingAnalytics = false;
          });

          // Cache the result
          const cacheKey = `nutritionAnalytics_${days}`;
          set((s) => {
            s._cache[cacheKey] = {
              data: analyticsData,
              key: createCacheKey({ days }),
              timestamp: Date.now(),
            };
          });
        } catch (error) {
          console.error("Failed to fetch nutrition analytics:", error);
          set((state) => {
            state.isLoadingAnalytics = false;
            state.nutritionAnalytics = null;
          });
        }
      },

      getMealHistory: () => {
        const state = get();
        return state.mealHistory;
      },

      getNutritionAnalytics: () => {
        const state = get();
        return state.nutritionAnalytics;
      },

      clearAnalyticsData: () => {
        set((state) => {
          state.mealHistory = [];
          state.nutritionAnalytics = null;
          state.isLoadingHistory = false;
          state.isLoadingAnalytics = false;
        });

        // Clear related cache
        get()._invalidateCache(["mealHistory", "nutritionAnalytics"]);
      },

      _initializeListeners: () => {
        if (typeof window !== "undefined") {
          const handleUserChange = () => {
            set((state) => {
              state.dailyNutrition = {};
              state.currentDate = new Date().toISOString().split("T")[0];
              state._cache = {};
            });
          };

          const handleGoalsChange = () => {
            get()._invalidateCache(["remainingMacros", "progressPercentages"]);
          };

          const handleUserClear = () => {
            set((state) => {
              state.dailyNutrition = {};
              state.currentDate = new Date().toISOString().split("T")[0];
              state.isSyncing = false;
              state._cache = {};
            });
          };

          window.addEventListener("userChanged", handleUserChange);
          window.addEventListener("nutritionGoalsChanged", handleGoalsChange);
          window.addEventListener("userCleared", handleUserClear);

          // Store cleanup function
          (get as any)._cleanup = () => {
            window.removeEventListener("userChanged", handleUserChange);
            window.removeEventListener(
              "nutritionGoalsChanged",
              handleGoalsChange,
            );
            window.removeEventListener("userCleared", handleUserClear);
          };
        }
      },

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
          const token = useUserStore.getState().getToken();
          if (token) {
            get().fetchDayNutrition(date, token);
          }
        }
      },

      addFoodEntry: (date, entry, token) => {
        const authToken = token || useUserStore.getState().getToken();

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

        // Debounced sync
        const debouncedSync = debounce(() => {
          if (authToken) {
            get().syncNutritionData(authToken);
          }
        }, 750);
        debouncedSync();
      },

      removeFoodEntry: (date, entryId, token) => {
        const authToken = token || useUserStore.getState().getToken();

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

        const debouncedSync = debounce(() => {
          if (authToken) {
            get().syncNutritionData(authToken);
          }
        }, 500);
        debouncedSync();
      },

      updateFoodEntry: (date, entryId, updates, token) => {
        const authToken = token || useUserStore.getState().getToken();

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

        const debouncedSync = debounce(() => {
          if (authToken) {
            get().syncNutritionData(authToken);
          }
        }, 500);
        debouncedSync();
      },

      syncNutritionData: async (token) => {
        const state = get();
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (state.isSyncing || !user || !authToken) return;

        set((s) => {
          s.isSyncing = true;
        });

        try {
          const { api } = await import("@/lib/api");
          const unsyncedDays = Object.entries(state.dailyNutrition)
            .filter(([, dayData]) => !dayData.synced)
            .map(([date, dayData]) => ({ date, dayData }));

          const syncPromises = unsyncedDays
            .filter(({ date }) => !inFlightDays.has(date))
            .map(async ({ date, dayData }) => {
              inFlightDays.add(date);
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
                      Authorization: `Bearer ${authToken}`,
                    },
                  },
                );

                set((s) => {
                  if (s.dailyNutrition[date]) {
                    s.dailyNutrition[date].synced = true;
                    s.dailyNutrition[date].lastModified =
                      response.data?.data?.lastModified ||
                      new Date().toISOString();
                    if (response.data?.data?.foodEntries) {
                      s.dailyNutrition[date].foodEntries =
                        response.data.data.foodEntries;
                    }
                  }
                });
              } catch (error) {
                console.error(`Failed to sync day ${date}:`, error);
                await get().fetchDayNutrition(date, authToken);
              } finally {
                inFlightDays.delete(date);
              }
            });

          await Promise.allSettled(syncPromises);
        } catch (error) {
          console.error("Sync failed:", error);
        } finally {
          set((s) => {
            s.isSyncing = false;
          });
          get()._invalidateCache([
            "currentDayNutrition",
            "remainingMacros",
            "progressPercentages",
          ]);
        }
      },

      fetchDayNutrition: async (date, token) => {
        const cacheKey = `dayNutrition_${date}`;
        const state = get();

        if (isCacheValid(state._cache, cacheKey)) {
          return;
        }
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!user || !authToken) return;

        try {
          const { api } = await import("@/lib/api");
          const response = await api.get(`/meals/day/${date}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          const data = response.data?.data || {};
          set((s) => {
            s.dailyNutrition[date] = {
              date,
              totalCalories: data.totalMacros?.calories || 0,
              totalProtein: data.totalMacros?.protein || 0,
              totalCarbs: data.totalMacros?.carbs || 0,
              totalFat: data.totalMacros?.fat || 0,
              foodEntries: Array.isArray(data.foodEntries)
                ? data.foodEntries
                : [],
              synced: true,
              lastModified: data.lastModified || new Date().toISOString(),
            };
          });
        } catch (error) {
          console.error(`Failed to fetch day ${date}:`, error);
          set((s) => {
            if (!s.dailyNutrition[date]) {
              s.dailyNutrition[date] = {
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

      calculateAndSaveDailyCalories: async (date, token) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const authToken = token || useUserStore.getState().getToken();
        const user = useUserStore.getState().user;

        if (!dayData || !user) return;

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

        set((s) => {
          if (s.dailyNutrition[targetDate]) {
            s.dailyNutrition[targetDate].totalCalories =
              calculatedTotals.calories;
            s.dailyNutrition[targetDate].totalProtein =
              calculatedTotals.protein;
            s.dailyNutrition[targetDate].totalCarbs = calculatedTotals.carbs;
            s.dailyNutrition[targetDate].totalFat = calculatedTotals.fat;
            s.dailyNutrition[targetDate].synced = false;
            s.dailyNutrition[targetDate].lastModified =
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

            set((s) => {
              if (s.dailyNutrition[targetDate]) {
                s.dailyNutrition[targetDate].synced = true;
                s.dailyNutrition[targetDate].lastModified =
                  response.data?.data?.lastModified || new Date().toISOString();
                if (response.data?.data?.foodEntries) {
                  s.dailyNutrition[targetDate].foodEntries =
                    response.data.data.foodEntries;
                }
              }
            });
          } catch (error) {
            console.error("Failed to save daily calories:", error);
            await get().fetchDayNutrition(targetDate, authToken);
          }
        }
      },

      getCurrentDayNutrition: () => {
        const state = get();
        const { currentDate, dailyNutrition } = state;
        const cacheKey = "currentDayNutrition";
        const dataKey = createCacheKey({
          currentDate,
          hasData: !!dailyNutrition[currentDate],
          lastModified: dailyNutrition[currentDate]?.lastModified,
        });

        const cached = state._cache[cacheKey];
        if (cached && cached.key === dataKey) {
          return cached.data;
        }

        const result = dailyNutrition[currentDate] || {
          date: currentDate,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          foodEntries: [],
          synced: true,
          lastModified: new Date().toISOString(),
        };

        set((s) => {
          s._cache[cacheKey] = {
            data: result,
            key: dataKey,
            timestamp: Date.now(),
          };
        });

        return result;
      },

      getRemainingMacros: (date) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const goals = useUserStore.getState().getUserGoals();
        const cacheKey = `remainingMacros_${targetDate}`;

        const dataKey = createCacheKey({
          targetDate,
          dayData: dayData && {
            totalCalories: dayData.totalCalories,
            totalProtein: dayData.totalProtein,
            totalCarbs: dayData.totalCarbs,
            totalFat: dayData.totalFat,
          },
          goals,
        });

        const cached = state._cache[cacheKey];
        if (cached && cached.key === dataKey) {
          return cached.data;
        }

        const result = !dayData
          ? goals
          : {
              calories: Math.max(0, goals.calories - dayData.totalCalories),
              protein: Math.max(0, goals.protein - dayData.totalProtein),
              carbs: Math.max(0, goals.carbs - dayData.totalCarbs),
              fat: Math.max(0, goals.fat - dayData.totalFat),
            };

        set((s) => {
          s._cache[cacheKey] = {
            data: result,
            key: dataKey,
            timestamp: Date.now(),
          };
        });

        return result;
      },

      getProgressPercentages: (date) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        const goals = useUserStore.getState().getUserGoals();
        const cacheKey = `progressPercentages_${targetDate}`;

        const dataKey = createCacheKey({
          targetDate,
          dayData: dayData && {
            totalCalories: dayData.totalCalories,
            totalProtein: dayData.totalProtein,
            totalCarbs: dayData.totalCarbs,
            totalFat: dayData.totalFat,
          },
          goals,
        });

        const cached = state._cache[cacheKey];
        if (cached && cached.key === dataKey) {
          return cached.data;
        }

        const result = !dayData
          ? { calories: 0, protein: 0, carbs: 0, fat: 0 }
          : {
              calories: Math.round(
                (dayData.totalCalories / Math.max(1, goals.calories)) * 100,
              ),
              protein: Math.round(
                (dayData.totalProtein / Math.max(1, goals.protein)) * 100,
              ),
              carbs: Math.round(
                (dayData.totalCarbs / Math.max(1, goals.carbs)) * 100,
              ),
              fat: Math.round(
                (dayData.totalFat / Math.max(1, goals.fat)) * 100,
              ),
            };

        set((s) => {
          s._cache[cacheKey] = {
            data: result,
            key: dataKey,
            timestamp: Date.now(),
          };
        });

        return result;
      },
    })),
    {
      name: "nutrition-storage",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        dailyNutrition: state.dailyNutrition,
        currentDate: state.currentDate,
      }),
      merge: (persistedState: any, currentState: any) =>
        deepMerge(currentState, persistedState),
      version: 1,
    },
  ),
);
