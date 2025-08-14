/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useDailyMeals.ts
import { useCallback } from 'react';
import { useUserStore } from '@/store/user-store';
import { useAuth } from '@clerk/nextjs';

export interface MealEntry {
  id: string;
  name: string;
  quantity: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  analysisData?: any;
  imageUrl?: string;
  addedAt: string;
}

export interface DailyMealsSummary {
  totalMeals: number;
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  remainingMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  progressPercentages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const useDailyMeals = () => {
  const {
    addFoodEntry,
    removeFoodEntry,
    getCurrentDayNutrition,
    getRemainingMacros,
    getProgressPercentages,
    getUserGoals,
    currentDate,
    setCurrentDate,
    fetchDayNutrition,
    syncNutritionData,
    isSyncing,
    user
  } = useUserStore();
  const {getToken} = useAuth()
  // Track a complete meal (from analysis result + any additions)
  const trackMeal = useCallback(async (
    mealName: string,
    quantity: string,
    totalMacros: { calories: number; protein: number; carbs: number; fat: number },
    analysisData?: any,
    imageUrl?: string,
    date?: string
  ) => {
    const targetDate = date || currentDate;
    const token = await getToken()
     addFoodEntry(targetDate, {
      foodName: mealName,
      quantity,
      calories: totalMacros.calories,
      protein: totalMacros.protein,
      carbs: totalMacros.carbs,
      fat: totalMacros.fat,
      analysisType: imageUrl ? 'image' : 'text',
      imageUrl,
      analysisData
    },token || undefined);
  }, [addFoodEntry, currentDate]);

  // Add individual food item to existing meal
  const addFoodToMeal = useCallback(async (
    foodName: string,
    quantity: string,
    macros: { calories: number; protein: number; carbs: number; fat: number },
    date?: string
  ) => {
    const targetDate = date || currentDate;
    const token = await getToken()
    
     addFoodEntry(targetDate, {
      foodName,
      quantity,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      analysisType: 'text'
    }, token || undefined);
  }, [addFoodEntry, currentDate]);

  // Remove a food entry
  const removeFoodFromDay = useCallback(async (entryId: string, date?: string) => {
    const token = await getToken()

    const targetDate = date || currentDate;
     removeFoodEntry(targetDate, entryId, token || undefined);
  }, [removeFoodEntry, currentDate]);

  // Get comprehensive daily summary
  const getDailySummary = useCallback((date?: string): DailyMealsSummary => {
    const targetDate = date || currentDate;
    const dayNutrition = getCurrentDayNutrition();
    const remaining = getRemainingMacros(targetDate);
    const progress = getProgressPercentages(targetDate);

    return {
      totalMeals: dayNutrition.foodEntries.length,
      totalMacros: {
        calories: dayNutrition.totalCalories,
        protein: dayNutrition.totalProtein,
        carbs: dayNutrition.totalCarbs,
        fat: dayNutrition.totalFat
      },
      remainingMacros: remaining,
      progressPercentages: progress
    };
  }, [getCurrentDayNutrition, getRemainingMacros, getProgressPercentages, currentDate]);

  // Navigate between dates
  const changeDate = useCallback((date: string) => {
    setCurrentDate(date);
  }, [setCurrentDate]);

  // Manual sync trigger
  const syncMeals = useCallback(async () => {
    const token = await getToken()
    await syncNutritionData(token || undefined);
  }, [syncNutritionData]);

  // Get user's nutrition goals
  const goals = getUserGoals();

  return {
    // Core data
    currentDate,
    currentDayNutrition: getCurrentDayNutrition(),
    goals,
    isSyncing,
    user,

    // Actions
    trackMeal,
    addFoodToMeal,
    removeFoodFromDay,
    changeDate,
    syncMeals,
    fetchDayNutrition,

    // Computed values
    getDailySummary,
    remainingMacros: getRemainingMacros(),
    progressPercentages: getProgressPercentages()
  };
};
