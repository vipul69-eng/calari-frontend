/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useMemo } from "react";
import { useUserStore } from "./user-store";
import { useNutritionStore } from "./nutrition-store";
import { useRecipeStore } from "./recipe-store";

// Hydration utility
export const useHydrateStores = () => {
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    // Rehydrate all stores
    useUserStore.persist.rehydrate();
    useNutritionStore.persist.rehydrate();
    useRecipeStore.persist.rehydrate();

    // Initialize cross-store listeners
    useNutritionStore.getState()._initializeListeners();
    useRecipeStore.getState()._initializeListeners();

    setHydrated(true);
  }, []);

  return hydrated;
};

// User hooks
export const useCurrentUser = () => useUserStore((state) => state.user);
export const useUserToken = () => useUserStore((state) => state.userToken);
export const useSetUser = () => useUserStore((state) => state.setUser);
export const useSetUserToken = () =>
  useUserStore((state) => state.setUserToken);
export const useUpdateUserProfile = () =>
  useUserStore((state) => state.updateUserProfile);
export const useUpdateNutritionGoals = () =>
  useUserStore((state) => state.updateNutritionGoals);
export const useClearUser = () => useUserStore((state) => state.clearUser);
export const useNutritionGoals = () =>
  useUserStore((state) => state.getUserGoals());

// Nutrition hooks
export const useCurrentDate = () =>
  useNutritionStore((state) => state.currentDate);
export const useSetCurrentDate = () =>
  useNutritionStore((state) => state.setCurrentDate);
export const useAddFoodEntry = () =>
  useNutritionStore((state) => state.addFoodEntry);
export const useRemoveFoodEntry = () =>
  useNutritionStore((state) => state.removeFoodEntry);
export const useUpdateFoodEntry = () =>
  useNutritionStore((state) => state.updateFoodEntry);
export const useSyncNutritionData = () =>
  useNutritionStore((state) => state.syncNutritionData);
export const useCurrentDayNutrition = () =>
  useNutritionStore((state) => state.getCurrentDayNutrition());
export const useRemainingMacros = () =>
  useNutritionStore((state) => state.getRemainingMacros());
export const useProgressPercentages = () =>
  useNutritionStore((state) => state.getProgressPercentages());
export const useIsSyncing = () => useNutritionStore((state) => state.isSyncing);

// Recipe hooks
export const useRecipes = () => {
  const recipes = useRecipeStore((state) => state.recipes || []);
  return useMemo(() => {
    if (!Array.isArray(recipes)) return [];
    return [...recipes].sort((a, b) => {
      const tb = new Date(b?.createdAt || 0).getTime() || 0;
      const ta = new Date(a?.createdAt || 0).getTime() || 0;
      return tb - ta;
    });
  }, [recipes]);
};

export const useRecipeById = (recipeId: string) =>
  useRecipeStore((state) => state.getRecipe(recipeId));

export const useAddRecipe = () => useRecipeStore((state) => state.addRecipe);
export const useRemoveRecipe = () =>
  useRecipeStore((state) => state.removeRecipe);
export const useUpdateRecipe = () =>
  useRecipeStore((state) => state.updateRecipe);
export const useSyncRecipes = () =>
  useRecipeStore((state) => state.syncRecipes);
export const useFetchRecipes = () =>
  useRecipeStore((state) => state.fetchRecipes);

// Combined hooks for complex operations
export const useInitializeUserData = () => {
  const fetchDayNutrition = useNutritionStore(
    (state) => state.fetchDayNutrition,
  );
  const fetchRecipes = useRecipeStore((state) => state.fetchRecipes);
  const currentDate = useCurrentDate();

  return React.useCallback(
    (user: any, token: string) => {
      // Fetch initial data when user is set
      if (token && user) {
        fetchDayNutrition(currentDate, token);
        fetchRecipes(token);
      }
    },
    [fetchDayNutrition, fetchRecipes, currentDate],
  );
};

export type * from "@/types/store";

export { useUserStore, useNutritionStore, useRecipeStore };
