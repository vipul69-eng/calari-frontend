/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/userStore.ts
import React from "react";
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
  analysisType: 'image' | 'text';
  imageUrl?: string;
  analysisData?: any;
  createdAt: string;
}

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
  dailyNutrition: Record<string, DailyNutrition>;
  currentDate: string;
  isSyncing: boolean;
  lastSyncTime: string | null;
  
  // Cache for stable references
  _cache: {
    currentDayNutrition: DailyNutrition | null;
    userGoals: NutritionGoals | null;
    remainingMacros: NutritionGoals | null;
    progressPercentages: NutritionGoals | null;
    // Cache keys for validation
    currentDayKey: string | null;
    userGoalsKey: string | null;
    remainingMacrosKey: string | null;
    progressPercentagesKey: string | null;
  };
  
  setUser: (user: User) => void;
  updateUserProfile: (profileUpdates: Partial<UserProfile>) => void;
  updateNutritionGoals: (goals: NutritionGoals) => void;
  clearUser: () => void;
  
  setCurrentDate: (date: string) => void;
  addFoodEntry: (date: string, entry: Omit<FoodEntry, 'id' | 'createdAt'>, token?: string) => void;
  removeFoodEntry: (date: string, entryId: string, token?: string) => void;
  updateFoodEntry: (date: string, entryId: string, updates: Partial<FoodEntry>, token?: string) => void;
  syncNutritionData: (token?: string) => Promise<void>;
  fetchDayNutrition: (date: string, token?: string) => Promise<void>;
  calculateAndSaveDailyCalories: (date?: string, token?: string) => Promise<void>;
  
  // Stable computed getters
  getCurrentDayNutrition: () => DailyNutrition;
  getRemainingMacros: (date?: string) => NutritionGoals;
  getProgressPercentages: (date?: string) => NutritionGoals;
  getUserGoals: () => NutritionGoals;
  
  // Cache invalidation helper
  _invalidateCache: (keys?: string[]) => void;
}

// Helper to create cache keys
const createCacheKey = (obj: any): string => {
  return JSON.stringify(obj);
};

// Helper to check if objects are equal
const isDeepEqual = (a: any, b: any): boolean => {
  return JSON.stringify(a) === JSON.stringify(b);
};

export const useUserStore = create<UserState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      user: null,
      dailyNutrition: {},
      currentDate: new Date().toISOString().split('T')[0],
      isSyncing: false,
      lastSyncTime: null,
      
      _cache: {
        currentDayNutrition: null,
        userGoals: null,
        remainingMacros: null,
        progressPercentages: null,
        currentDayKey: null,
        userGoalsKey: null,
        remainingMacrosKey: null,
        progressPercentagesKey: null,
      },

      _invalidateCache: (keys) => {
        set((state) => {
          if (!keys) {
            // Invalidate all caches
            state._cache = {
              currentDayNutrition: null,
              userGoals: null,
              remainingMacros: null,
              progressPercentages: null,
              currentDayKey: null,
              userGoalsKey: null,
              remainingMacrosKey: null,
              progressPercentagesKey: null,
            };
          } else {
            keys.forEach(key => {
              if (key === 'currentDayNutrition') {
                state._cache.currentDayNutrition = null;
                state._cache.currentDayKey = null;
              }
              if (key === 'userGoals') {
                state._cache.userGoals = null;
                state._cache.userGoalsKey = null;
              }
              if (key === 'remainingMacros') {
                state._cache.remainingMacros = null;
                state._cache.remainingMacrosKey = null;
              }
              if (key === 'progressPercentages') {
                state._cache.progressPercentages = null;
                state._cache.progressPercentagesKey = null;
              }
            });
          }
        });
      },

      // User management
      setUser: (user) => {
        set((state) => {
          state.user = user;
        });
        get()._invalidateCache(['userGoals', 'remainingMacros', 'progressPercentages']);
      },

      updateUserProfile: (profileUpdates) => {
        set((state) => {
          if (state.user) {
            state.user.profile = { ...state.user.profile, ...profileUpdates };
          }
        });
        get()._invalidateCache(['userGoals', 'remainingMacros', 'progressPercentages']);
      },

      updateNutritionGoals: (goals) => {
        set((state) => {
          if (state.user) {
            state.user.profile.macros = goals;
          }
        });
        get()._invalidateCache(['userGoals', 'remainingMacros', 'progressPercentages']);
      },

      clearUser: () => {
        set((state) => {
          state.user = null;
          state.dailyNutrition = {};
          state.currentDate = new Date().toISOString().split('T')[0];
          state.isSyncing = false;
          state.lastSyncTime = null;
        });
        get()._invalidateCache();
      },

      // Nutrition tracking
      setCurrentDate: (date) => {
        set((state) => {
          state.currentDate = date;
        });
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
        
        if (!get().dailyNutrition[date]) {
          get().fetchDayNutrition(date);
        }
      },

      calculateAndSaveDailyCalories: async (date, token) => {
        const state = get();
        const targetDate = date || state.currentDate;
        const dayData = state.dailyNutrition[targetDate];
        
        if (!dayData || !state.user) return;

        const calculatedTotals = dayData.foodEntries.reduce(
          (acc, entry) => {
            acc.calories += Number(entry.calories);
            acc.protein += Number(entry.protein);
            acc.carbs += Number(entry.carbs);
            acc.fat += Number(entry.fat);
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        set((state) => {
          if (state.dailyNutrition[targetDate]) {
            state.dailyNutrition[targetDate].totalCalories = calculatedTotals.calories;
            state.dailyNutrition[targetDate].totalProtein = calculatedTotals.protein;
            state.dailyNutrition[targetDate].totalCarbs = calculatedTotals.carbs;
            state.dailyNutrition[targetDate].totalFat = calculatedTotals.fat;
            state.dailyNutrition[targetDate].synced = false;
            state.dailyNutrition[targetDate].lastModified = new Date().toISOString();
          }
        });

        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);

        if (token) {
          try {
            const { api } = await import('@/lib/api');
            
            const response = await api.post('/meals/sync', {
              date: targetDate,
              totalMacros: calculatedTotals,
              foodEntries: dayData.foodEntries
            }, {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            });

            set((state) => {
              if (state.dailyNutrition[targetDate]) {
                state.dailyNutrition[targetDate].synced = true;
                state.dailyNutrition[targetDate].lastModified = response.data.data?.lastModified || new Date().toISOString();
              }
            });

          } catch (error) {
            console.error(`Failed to save daily calories for ${targetDate}:`, error);
          }
        }
      },

      addFoodEntry: (date, entry, token) => {
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
              lastModified: new Date().toISOString()
            };
          }

          const newEntry: FoodEntry = {
            ...entry,
            id: `temp_${Date.now()}_${Math.random()}`,
            createdAt: new Date().toISOString()
          };

          state.dailyNutrition[date].foodEntries.push(newEntry);
          
          state.dailyNutrition[date].totalCalories += Number(entry.calories);
          state.dailyNutrition[date].totalProtein += Number(entry.protein);
          state.dailyNutrition[date].totalCarbs += Number(entry.carbs);
          state.dailyNutrition[date].totalFat += Number(entry.fat);
          
          state.dailyNutrition[date].synced = false;
          state.dailyNutrition[date].lastModified = new Date().toISOString();
        });
        
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
        setTimeout(() => get().syncNutritionData(token), 1500);
      },

      removeFoodEntry: (date, entryId, token) => {
        set((state) => {
          const dayData = state.dailyNutrition[date];
          if (!dayData) return;

          const entryIndex = dayData.foodEntries.findIndex((e:any) => e.id === entryId);
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
        
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
        get().syncNutritionData(token);
      },

      updateFoodEntry: (date, entryId, updates, token) => {
        set((state) => {
          const dayData = state.dailyNutrition[date];
          if (!dayData) return;

          const entryIndex = dayData.foodEntries.findIndex((e:any) => e.id === entryId);
          if (entryIndex === -1) return;

          const oldEntry = dayData.foodEntries[entryIndex];
          const newEntry = { ...oldEntry, ...updates };

          dayData.totalCalories = dayData.totalCalories - Number(oldEntry.calories) + Number(newEntry.calories);
          dayData.totalProtein = dayData.totalProtein - Number(oldEntry.protein) + Number(newEntry.protein);
          dayData.totalCarbs = dayData.totalCarbs - Number(oldEntry.carbs) + Number(newEntry.carbs);
          dayData.totalFat = dayData.totalFat - Number(oldEntry.fat) + Number(newEntry.fat);

          dayData.foodEntries[entryIndex] = newEntry;
          dayData.synced = false;
          dayData.lastModified = new Date().toISOString();
        });
        
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
        get().syncNutritionData(token);
      },

      syncNutritionData: async (token) => {
        const state = get();
        if (state.isSyncing || !state.user) return;

        set((state) => {
          state.isSyncing = true;
        });

        try {
          const { api } = await import('@/lib/api');
          
          const unsyncedDays = Object.entries(state.dailyNutrition)
            .filter(([, dayData]) => !dayData.synced)
            .map(([date, dayData]) => ({ date, dayData }));
            for (const { date, dayData } of unsyncedDays) {
            console.log("date is", date)
            try {
              const response = await api.post('/meals/sync', {
                date,
                totalMacros: {
                  calories: dayData.totalCalories,
                  protein: dayData.totalProtein,
                  carbs: dayData.totalCarbs,
                  fat: dayData.totalFat
                },
                foodEntries: dayData.foodEntries
              }, {
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                }
              });

              set((state) => {
                if (state.dailyNutrition[date]) {
                  state.dailyNutrition[date].synced = true;
                  state.dailyNutrition[date].lastModified = response.data.data?.lastModified || new Date().toISOString();
                  
                  if (response.data.data?.foodEntries) {
                    state.dailyNutrition[date].foodEntries = response.data.data.foodEntries;
                  }
                }
              });
            } catch (error) {
              console.error(`Failed to sync nutrition data for ${date}:`, error);
              
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
          console.error('Sync nutrition data error:', error);
        } finally {
          set((state) => {
            state.isSyncing = false;
          });
        }
        
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
      },

      fetchDayNutrition: async (date, token) => {
        const state = get();
        if (!state.user) return;

        try {
          const { api } = await import('@/lib/api');
          
          const response = await api.get(`/meals/day/${date}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
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
              lastModified: data.lastModified || new Date().toISOString()
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
                lastModified: new Date().toISOString()
              };
            }
          });
        }
        
        get()._invalidateCache(['currentDayNutrition', 'remainingMacros', 'progressPercentages']);
      },

      // STABLE COMPUTED GETTERS WITH CACHING
      getCurrentDayNutrition: () => {
        const state = get();
        const { currentDate, dailyNutrition, _cache } = state;
        
        const currentKey = createCacheKey({ currentDate, hasData: !!dailyNutrition[currentDate], lastModified: dailyNutrition[currentDate]?.lastModified });
        
        // Return cached value if key matches
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
          lastModified: new Date().toISOString()
        };
        
        // Cache the new value
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
          fat: 80
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
        
        const cacheKey = createCacheKey({ targetDate, dayData: dayData && { totalCalories: dayData.totalCalories, totalProtein: dayData.totalProtein, totalCarbs: dayData.totalCarbs, totalFat: dayData.totalFat }, goals });
        
        if (state._cache.remainingMacrosKey === cacheKey && state._cache.remainingMacros) {
          return state._cache.remainingMacros;
        }
        
        const newValue = !dayData ? goals : {
          calories: Math.max(0, goals.calories - dayData.totalCalories),
          protein: Math.max(0, goals.protein - dayData.totalProtein),
          carbs: Math.max(0, goals.carbs - dayData.totalCarbs),
          fat: Math.max(0, goals.fat - dayData.totalFat)
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
        
        const cacheKey = createCacheKey({ targetDate, dayData: dayData && { totalCalories: dayData.totalCalories, totalProtein: dayData.totalProtein, totalCarbs: dayData.totalCarbs, totalFat: dayData.totalFat }, goals });
        
        if (state._cache.progressPercentagesKey === cacheKey && state._cache.progressPercentages) {
          return state._cache.progressPercentages;
        }
        
        const newValue = !dayData ? { calories: 0, protein: 0, carbs: 0, fat: 0 } : {
          calories: Math.min(100, Math.round((dayData.totalCalories / goals.calories) * 100)),
          protein: Math.min(100, Math.round((dayData.totalProtein / goals.protein) * 100)),
          carbs: Math.min(100, Math.round((dayData.totalCarbs / goals.carbs) * 100)),
          fat: Math.min(100, Math.round((dayData.totalFat / goals.fat) * 100))
        };
        
        set((state) => {
          state._cache.progressPercentages = newValue;
          state._cache.progressPercentagesKey = cacheKey;
        });
        
        return newValue;
      }
    })),
    {
      name: "user-storage",
      partialize: (state) => ({
        user: state.user,
        dailyNutrition: state.dailyNutrition,
        currentDate: state.currentDate,
        lastSyncTime: state.lastSyncTime
        // Don't persist cache
      }),
      skipHydration: true,
    }
  )
);

// Simple utility hooks without memoization (the store handles stability now)
export const useHydrateUserStore = () => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    useUserStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
};

export const useCurrentUser = () => useUserStore((state) => state.user);
export const useNutritionGoals = () => useUserStore((state) => state.getUserGoals());
export const useCurrentDayNutrition = () => useUserStore((state) => state.getCurrentDayNutrition());
export const useRemainingMacros = () => useUserStore((state) => state.getRemainingMacros());
export const useProgressPercentages = () => useUserStore((state) => state.getProgressPercentages());
