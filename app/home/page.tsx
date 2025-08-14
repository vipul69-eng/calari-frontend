/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useMemo, useEffect, useState } from "react"
import { Camera, Flame, RefreshCw, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import { 
  useCurrentUser, 
  useCurrentDayNutrition, 
  useNutritionGoals, 
  useProgressPercentages,
  useUserStore 
} from "@/store/user-store"
import { useMealCountStore } from "@/store/use-count"

type MealDisplay = {
  id: string
  title: string
  kcal: number
  grams: string
  timeLabel: string
  macros: { protein: number; fat: number; carbs: number }
  emoji: string
  color: "emerald" | "rose" | "amber" | "sky"
  analysisType?: 'image' | 'text'
}

// Helper function to convert food entry to meal display format
const convertFoodEntryToMeal = (entry: any, index: number): MealDisplay => {
  const colors: ("emerald" | "rose" | "amber" | "sky")[] = ["emerald", "sky", "amber", "rose"];
  const emojis = ["🥗", "🥕", "🥑", "🍗", "🍎", "🥙", "🍲", "🥯", "🍳", "🥞"];
  
  const createdTime = new Date(entry.createdAt);
  const timeLabel = createdTime.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });

  return {
    id: entry.id,
    title: entry.foodName,
    kcal: Math.round(Number(entry.calories)),
    grams: entry.quantity,
    timeLabel,
    macros: {
      protein: Math.round(Number(entry.protein)),
      fat: Math.round(Number(entry.fat)),
      carbs: Math.round(Number(entry.carbs))
    },
    emoji: emojis[index % emojis.length],
    color: colors[index % colors.length],
    analysisType: entry.analysisType
  };
};

export default function MainPage() {
  const router = useRouter()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  
  // Store data
  const user = useCurrentUser()
  const currentDayNutrition = useCurrentDayNutrition()
  const goals = useNutritionGoals()
  const progressPercentages = useProgressPercentages()
  const isSyncing = useUserStore((state) => state.isSyncing)
  
  // Store actions
  const calculateAndSaveDailyCalories = useUserStore((state) => state.calculateAndSaveDailyCalories)
  const fetchDayNutrition = useUserStore((state) => state.fetchDayNutrition)
  const syncNutritionData = useUserStore((state) => state.syncNutritionData)
  const removeFoodEntry = useUserStore((state) => state.removeFoodEntry)
  
  // Local state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const {mealsScanned} = useMealCountStore()
  
  const now = useMemo(() => new Date(), [])
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now)
  const fullDate = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long" }).format(now)
  const currentDate = now.toISOString().split('T')[0]

  // Convert food entries to meals format
  const meals = useMemo(() => {
    return currentDayNutrition.foodEntries.map((entry, index) => 
      convertFoodEntryToMeal(entry, index)
    );
  }, [currentDayNutrition.foodEntries]);

  // Calculate totals from store data
  const total = useMemo(() => ({
    kcal: Math.round(currentDayNutrition.totalCalories),
    protein: Math.round(currentDayNutrition.totalProtein),
    fat: Math.round(currentDayNutrition.totalFat),
    carbs: Math.round(currentDayNutrition.totalCarbs)
  }), [currentDayNutrition]);

  // Calculate progress percentage
  const pct = Math.min(100, Math.round((total.kcal / goals.calories) * 100));

  // Load today's nutrition data on mount
  useEffect(() => {
    const loadTodaysData = async () => {
      if (isLoaded && isSignedIn && user && currentDayNutrition.foodEntries.length === 0) {
        try {
          const token = await getToken();
          if (token) {
            await fetchDayNutrition(currentDate, token);
          }
        } catch {
          // Silently handle error
        }
      }
    };

    loadTodaysData();
  }, [isLoaded, isSignedIn, user, currentDate, currentDayNutrition.foodEntries.length, getToken, fetchDayNutrition]);

  // Calculate and save daily calories when meals change
  useEffect(() => {
    const saveDailyCalories = async () => {
      if (isLoaded && isSignedIn && user && meals.length > 0) {
        try {
          const token = await getToken();
          if (token) {
            await calculateAndSaveDailyCalories(currentDate, token);
          }
        } catch {
          // Silently handle error
        }
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveDailyCalories, 2000);
    return () => clearTimeout(timeoutId);
  }, [meals.length, isLoaded, isSignedIn, user, currentDate, getToken, calculateAndSaveDailyCalories]);

  // Manual sync function
  const handleManualSync = async () => {
    if (!isSignedIn || !user) return;
    
    try {
      const token = await getToken();
      if (token) {
        await syncNutritionData(token);
      }
    } catch {
      // Silently handle error
    }
  };

  // Delete meal function
  const handleDeleteMeal = async (mealId: string) => {
    if (!isSignedIn || !user || isDeleting) return;
    
    setIsDeleting(true);
    try {
      const token = await getToken();
      if (token) {
        await removeFoodEntry(currentDate, mealId, token);
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate?.(50);
        }
      }
    } catch (error) {
      console.error('Failed to delete meal:', error);
      // You could show an error toast here
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(null);
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <main className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg">Loading...</p>
        </div>
      </main>
    );
  }


  // Not signed in state
  if (!isSignedIn || !user) {
    return (
      <main className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🍎</div>
          <h1 className="text-2xl font-bold">Welcome to Calari</h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Please sign in to track your nutrition</p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center rounded-xl bg-black text-white px-6 py-3 font-medium hover:bg-black/90 transition dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Sign In
          </button>
        </div>
      </main>
    );
  }


  return (
    <>
      <main
        className="relative min-h-screen bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-50"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-neutral-200/70 dark:bg-black/80 dark:border-neutral-800">
          <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold">{dayName}</span>
                <span className="text-sm text-neutral-500">{fullDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sync button */}
              <button
                aria-label="Sync data"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>

              {/* Camera button */}
              <button
                aria-label="Open camera"
                onClick={() => router.push("/track")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 active:scale-95 transition dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* User Profile Badge */}
        <section className="mx-auto max-w-screen-sm px-4 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user.profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user.profile?.name || 'User'}</p>
                <p className="text-sm text-neutral-500 capitalize">{user.plan} Plan</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Today&apos;s Goal</p>
              <p className="font-semibold">{goals.calories} kcal</p>
            </div>
          </div>
        </section>

        {/* KPI Summary */}
        <section className="mx-auto max-w-screen-sm px-4">
          <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white shadow-sm dark:border-neutral-800 dark:from-neutral-900/60 dark:to-neutral-900/20">
            <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 blur-3xl opacity-50 dark:from-blue-900/20 dark:to-purple-900/20" />
            <div className="relative grid grid-cols-4 gap-3 p-4">
              <Stat 
                value={total.protein} 
                label="Protein" 
                progress={progressPercentages.protein}
                color="emerald"
              />
              <Stat 
                value={total.fat} 
                label="Fat" 
                progress={progressPercentages.fat}
                color="rose"
              />
              <Stat 
                value={total.carbs} 
                label="Carbs" 
                progress={progressPercentages.carbs}
                color="sky"
              />
              <div className="flex items-center justify-center">
                <Ring 
                  value={pct} 
                  center={`${total.kcal}`} 
                  sub="kcal" 
                  goal={goals.calories}
                  remaining={goals.calories - total.kcal}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Progress Overview */}
        <section className="mx-auto max-w-screen-sm px-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Meals Today</span>
                <span className="text-lg font-bold text-emerald-600">{meals.length}</span>
              </div>
              <div className="text-xs text-neutral-500">
                {meals.filter(m => m.analysisType === 'image').length} from photos
              </div>
            </div>
            
            <div className="rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Progress</span>
                <span className="text-lg font-bold text-blue-600">{pct}%</span>
              </div>
              <div className="text-xs text-neutral-500">
                {goals.calories - total.kcal > 0 ? `${goals.calories - total.kcal} kcal left` : 'Goal reached!'}
              </div>
            </div>
          </div>
        </section>

        {/* Meals List */}
        <section aria-label="Tracked meals" className="mx-auto max-w-screen-sm px-4 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Today&apos;s Meals</h2>
            {!currentDayNutrition.synced && meals.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Syncing...
              </span>
            )}
          </div>

          {meals.length > 0 ? (
            <div className="space-y-3">
              {meals.map((meal, index) => (
                <MealCard 
                  key={meal.id} 
                  meal={meal} 
                  index={index}
                  onDelete={() => setShowDeleteConfirm(meal.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState onAddMeal={() => router.push("/track")} />
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 max-w-sm w-full bg-white rounded-2xl p-6 shadow-xl dark:bg-neutral-900">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 dark:bg-red-900/20">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Delete Meal</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                Are you sure you want to delete this meal? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMeal(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ————— Subcomponents ————— */

function Stat({ 
  value, 
  label, 
  progress,
  color 
}: { 
  value: number; 
  label: string; 
  progress: number;
  color: "emerald" | "rose" | "sky";
}) {
  const colorClasses = {
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-rose-600",
    sky: "from-sky-500 to-sky-600"
  };

  return (
    <div className="flex min-w-[76px] min-h-[70px] flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/70 px-3 py-3.5 text-center shadow-sm backdrop-blur-sm sm:min-w-[88px] sm:min-h-[80px] dark:border-neutral-800 dark:from-neutral-900/60 dark:to-neutral-900/20">
      <div className="text-[clamp(1rem,4.5vw,1.375rem)] leading-tight font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {value}
      </div>
      <div className="mt-0.5 text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400">{label}</div>
      <div className="w-full h-1 bg-neutral-200 rounded-full mt-1 overflow-hidden dark:bg-neutral-700">
        <div 
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}

function Ring({ 
  value, 
  center, 
  sub, 
  goal,
  remaining 
}: { 
  value: number; 
  center: string; 
  sub: string;
  goal: number;
  remaining: number;
}) {
  const deg = Math.round((value / 100) * 360)
  const isComplete = remaining <= 0;
  
  return (
    <div className="relative grid place-items-center">
      <div
        className="h-16 w-16 rounded-full transition-all duration-500"
        style={{
          background: `conic-gradient(${isComplete ? '#10b981' : '#3b82f6'} ${deg}deg, #f5f5f5 ${deg}deg)`,
        }}
        aria-hidden="true"
      />
      <div className="absolute h-12 w-12 rounded-full bg-white grid place-items-center text-center shadow-sm dark:bg-neutral-900">
        <div className="leading-[1]">
          <div className="text-sm font-semibold tabular-nums">{center}</div>
          <div className="text-[10px] text-neutral-500">{sub}</div>
          <div className="text-[8px] text-neutral-400">
            /{goal}
          </div>
        </div>
      </div>
      {isComplete && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm">✓</span>
        </div>
      )}
    </div>
  )
}

function MealCard({ 
  meal, 
  index, 
  onDelete 
}: { 
  meal: MealDisplay; 
  index: number;
  onDelete: () => void;
}) {
  const colorClasses = {
    emerald: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20",
    rose: "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20",
    amber: "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
    sky: "border-sky-200 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20"
  };

  return (
    <article className={`rounded-3xl border p-4 shadow-sm transition hover:shadow-md ${colorClasses[meal.color]} backdrop-blur-sm relative group`}>
      {/* Delete button - only visible on hover */}
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        aria-label={`Delete ${meal.title}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" role="img" aria-label={meal.title}>
                {meal.emoji}
              </span>
              <h3 className="truncate text-[15px] font-semibold">{meal.title}</h3>
              {meal.analysisType === 'image' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                  📷 AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <Flame className="h-3.5 w-3.5 text-amber-600" />
              <span className="tabular-nums font-medium">{meal.kcal} kcal</span>
              <span className="opacity-60">•</span>
              <span className="tabular-nums">{meal.grams}</span>
              <span className="opacity-60">•</span>
              <time className="font-medium">{meal.timeLabel}</time>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500 dark:text-neutral-400">Meal #{index + 1}</div>
          </div>
        </div>

        {/* Macro chips with better spacing */}
        <div className="grid grid-cols-3 gap-2">
          <MacroChip label="Protein" value={meal.macros.protein} unit="g" barColor="#10b981" />
          <MacroChip label="Fat" value={meal.macros.fat} unit="g" barColor="#f43f5e" />
          <MacroChip label="Carbs" value={meal.macros.carbs} unit="g" barColor="#0ea5e9" />
        </div>
      </div>
    </article>
  )
}

function MacroChip({
  label,
  value,
  unit,
  barColor,
}: {
  label: string
  value: number
  unit: string
  barColor: string
}) {
  return (
    <div className="flex h-12 items-center justify-between rounded-xl border border-neutral-200/50 bg-white/70 px-3 shadow-sm backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-800/50">
      <div className="flex items-center gap-2">
        <span 
          className="block h-2 w-2 rounded-full" 
          style={{ backgroundColor: barColor }} 
          aria-hidden="true" 
        />
        <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-300">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {value}
        <span className="ml-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{unit}</span>
      </span>
    </div>
  )
}

function EmptyState({ onAddMeal }: { onAddMeal: () => void }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4" role="img" aria-label="Empty plate">🍽️</div>
      <h3 className="text-lg font-semibold mb-2">No meals tracked today</h3>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
        Start tracking your nutrition by taking a photo of your food or adding meals manually.
      </p>
      <button
        onClick={onAddMeal}
        className="inline-flex items-center gap-2 rounded-xl bg-black text-white px-6 py-3 font-medium hover:bg-black/90 transition dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      >
        <Camera className="h-4 w-4" />
        Add First Meal
      </button>
    </div>
  )
}
