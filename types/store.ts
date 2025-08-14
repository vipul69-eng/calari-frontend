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

export interface UserState {
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