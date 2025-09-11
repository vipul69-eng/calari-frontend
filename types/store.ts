/* eslint-disable @typescript-eslint/no-explicit-any */
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
  token?: string;
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

export interface StoreCache<T = any> {
  [key: string]: {
    data: T;
    key: string;
    timestamp: number;
  };
}

export interface MealHistoryEntry {
  date: string;
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  foodEntries: FoodEntry[];
  lastModified: string;
}

export interface NutritionAnalytics {
  totalDays: number;
  averageMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  dailyData: Array<{
    date: string;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;
}
