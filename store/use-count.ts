/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from '@/lib/api';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface MealCountState {
  mealsScanned: number;
  loading: boolean;
  error: string | null;
  fetchMealCount: (userId: string) => Promise<void>;
  incrementMealCount: (amount?: number) => void;
  resetMealCount: () => void;
}

export const useMealCountStore = create<MealCountState>()(
  persist(
    (set, get) => ({
      mealsScanned: 0,
      loading: false,
      error: null,

      // Fetch meal count from API
      fetchMealCount: async (userId:string) => {
        set({ loading: true, error: null });
        try {
          const res = await api.get(`/meals/count`,{
            headers:{
                "Authorization":`Bearer ${userId}`
            }
          });
          if (!res.data) throw new Error('Failed to fetch meal count');

          const data = await res.data;
          set({ mealsScanned: data.data || 0, loading: false });
        } catch (err: any) {
            console.log(err)
          set({ error: err.message, loading: false });
        }
      },

      // Optimistic increment (no API call)
      incrementMealCount: (amount = 1) => {
        set({ mealsScanned: get().mealsScanned + amount });
      },

      // Reset (e.g., when user logs out)
      resetMealCount: () => set({ mealsScanned: 0 }),
    }),
    {
      name: 'meal-count-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
