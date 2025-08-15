/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useMemo, useEffect, useState } from "react"
import { Camera, Flame, RefreshCw, Trash2, TrendingUp, Award, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"
import {
  useCurrentUser,
  useCurrentDayNutrition,
  useNutritionGoals,
  useProgressPercentages,
  useUserStore,
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
  analysisType?: "image" | "text"
}

// Helper function to convert food entry to meal display format
const convertFoodEntryToMeal = (entry: any, index: number): MealDisplay => {
  const colors: ("emerald" | "rose" | "amber" | "sky")[] = ["emerald", "sky", "amber", "rose"]
  const emojis = ["🥗", "🥕", "🥑", "🍗", "🍎", "🥙", "🍲", "🥯", "🍳", "🥞"]

  const createdTime = new Date(entry.createdAt)
  const timeLabel = createdTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return {
    id: entry.id,
    title: entry.foodName,
    kcal: Math.round(Number(entry.calories)),
    grams: entry.quantity,
    timeLabel,
    macros: {
      protein: Math.round(Number(entry.protein)),
      fat: Math.round(Number(entry.fat)),
      carbs: Math.round(Number(entry.carbs)),
    },
    emoji: emojis[index % emojis.length],
    color: colors[index % colors.length],
    analysisType: entry.analysisType,
  }
}

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
  const { mealsScanned } = useMealCountStore()

  const now = useMemo(() => new Date(), [])
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now)
  const fullDate = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long" }).format(now)
  const currentDate = now.toISOString().split("T")[0]

  // Convert food entries to meals format
  const meals = useMemo(() => {
    return currentDayNutrition.foodEntries.map((entry, index) => convertFoodEntryToMeal(entry, index))
  }, [currentDayNutrition.foodEntries])

  // Calculate totals from store data
  const total = useMemo(
    () => ({
      kcal: Math.round(currentDayNutrition.totalCalories),
      protein: Math.round(currentDayNutrition.totalProtein),
      fat: Math.round(currentDayNutrition.totalFat),
      carbs: Math.round(currentDayNutrition.totalCarbs),
    }),
    [currentDayNutrition],
  )

  // Calculate progress percentage
  const pct = Math.min(100, Math.round((total.kcal / goals.calories) * 100))

  // Load today's nutrition data on mount
  useEffect(() => {
    const loadTodaysData = async () => {
      if (isLoaded && isSignedIn && user && currentDayNutrition.foodEntries.length === 0) {
        try {
          const token = await getToken()
          if (token) {
            await fetchDayNutrition(currentDate, token)
          }
        } catch {
          // Silently handle error
        }
      }
    }

    loadTodaysData()
  }, [isLoaded, isSignedIn, user, currentDate, currentDayNutrition.foodEntries.length, getToken, fetchDayNutrition])

  // Calculate and save daily calories when meals change
  useEffect(() => {
    const saveDailyCalories = async () => {
      if (isLoaded && isSignedIn && user && meals.length > 0) {
        try {
          const token = await getToken()
          if (token) {
            await calculateAndSaveDailyCalories(currentDate, token)
          }
        } catch {
          // Silently handle error
        }
      }
    }

    // Debounce the save operation
    const timeoutId = setTimeout(saveDailyCalories, 2000)
    return () => clearTimeout(timeoutId)
  }, [meals.length, isLoaded, isSignedIn, user, currentDate, getToken, calculateAndSaveDailyCalories])

  // Manual sync function
  const handleManualSync = async () => {
    if (!isSignedIn || !user) return

    try {
      const token = await getToken()
      if (token) {
        await syncNutritionData(token)
      }
    } catch {
      // Silently handle error
    }
  }

  // Delete meal function
  const handleDeleteMeal = async (mealId: string) => {
    if (!isSignedIn || !user || isDeleting) return

    setIsDeleting(true)
    try {
      const token = await getToken()
      if (token) {
        await removeFoodEntry(currentDate, mealId, token)
        // Haptic feedback
        if ("vibrate" in navigator) {
          navigator.vibrate?.(50)
        }
      }
    } catch (error) {
      console.error("Failed to delete meal:", error)
      // You could show an error toast here
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(null)
    }
  }

  // Loading state
  if (!isLoaded) {
    return (
      <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-lg font-body">Loading...</p>
        </div>
      </main>
    )
  }

  // Not signed in state
  if (!isSignedIn || !user) {
    return (
      <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🍎</div>
          <h1 className="text-2xl font-bold font-heading">Welcome to Calari</h1>
          <p className="text-lg text-muted-foreground font-body">Please sign in to track your nutrition</p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition font-body"
          >
            Sign In
          </button>
        </div>
      </main>
    )
  }

  return (
    <>
      <main
        className="relative min-h-screen bg-gradient-to-br from-background via-muted/30 to-background text-foreground"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
          <div className="mx-auto flex max-w-screen-sm items-center justify-between px-4 py-4">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold font-heading text-foreground">{dayName}</span>
                <span className="text-sm text-muted-foreground font-body">{fullDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sync button */}
              <button
                aria-label="Sync data"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card/80 backdrop-blur-sm text-foreground hover:bg-accent hover:text-accent-foreground active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              </button>

              {/* Camera button */}
              <button
                aria-label="Open camera"
                onClick={() => router.push("/track")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>


        <section className="mx-auto max-w-screen-sm px-4 mt-2">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-background/50 to-muted/30 shadow-xl backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/10 via-primary/5 to-transparent blur-3xl" />
            <div className="relative grid grid-cols-4 gap-4 p-6">
              <Stat value={total.protein} label="Protein" progress={progressPercentages.protein} color="emerald" />
              <Stat value={total.fat} label="Fat" progress={progressPercentages.fat} color="rose" />
              <Stat value={total.carbs} label="Carbs" progress={progressPercentages.carbs} color="sky" />
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

        <section className="mx-auto max-w-screen-sm px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground font-body">Meals Today</span>
                <span className="text-2xl font-bold text-primary font-heading">{meals.length}</span>
              </div>
              <div className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {meals.filter((m) => m.analysisType === "image").length} from photos
              </div>
            </div>

            <div className="rounded-3xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground font-body">Progress</span>
                <span className="text-2xl font-bold text-primary font-heading">{pct}%</span>
              </div>
              <div className="text-xs text-muted-foreground font-body flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {goals.calories - total.kcal > 0 ? `${goals.calories - total.kcal} kcal left` : "Goal reached!"}
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Tracked meals" className="mx-auto max-w-screen-sm px-4 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-heading">Today&apos;s Meals</h2>
            {!currentDayNutrition.synced && meals.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 font-body">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Syncing...
              </span>
            )}
          </div>

          {meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <MealCard key={meal.id} meal={meal} index={index} onDelete={() => setShowDeleteConfirm(meal.id)} />
              ))}
            </div>
          ) : (
            <EmptyState onAddMeal={() => router.push("/track")} />
          )}
        </section>
      </main>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 max-w-sm w-full bg-card rounded-3xl p-6 shadow-2xl border border-border/50">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-heading">Delete Meal</h3>
              <p className="text-muted-foreground mb-6 font-body">
                Are you sure you want to delete this meal? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 border border-border rounded-2xl font-medium hover:bg-muted transition font-body disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteMeal(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-2xl font-medium hover:bg-destructive/90 transition disabled:opacity-50 flex items-center justify-center gap-2 font-body"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
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
  color,
}: {
  value: number
  label: string
  progress: number
  color: "emerald" | "rose" | "sky"
}) {
  const colorClasses = {
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-rose-600",
    sky: "from-sky-500 to-sky-600",
  }

  return (
    <div className="flex min-w-[80px] min-h-[85px] flex-col items-center justify-center rounded-3xl border border-border/30 bg-gradient-to-b from-card/90 to-muted/50 px-3 py-4 text-center shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
      <div className="text-xl font-bold tabular-nums text-foreground font-heading">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground font-body">{label}</div>
      <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} transition-all duration-700 ease-out`}
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
  remaining,
}: {
  value: number
  center: string
  sub: string
  goal: number
  remaining: number
}) {
  const deg = Math.round((value / 100) * 360)
  const isComplete = remaining <= 0

  return (
    <div className="relative grid place-items-center">
      <div
        className="h-20 w-20 rounded-full transition-all duration-700 ease-out shadow-lg"
        style={{
          background: `conic-gradient(${isComplete ? "#10b981" : "#059669"} ${deg}deg, #f1f5f9 ${deg}deg)`,
        }}
        aria-hidden="true"
      />
      <div className="absolute h-14 w-14 rounded-full bg-card grid place-items-center text-center shadow-sm border border-border/30">
        <div className="leading-[1]">
          <div className="text-sm font-bold tabular-nums font-heading">{center}</div>
          <div className="text-[10px] text-muted-foreground font-body">{sub}</div>
          <div className="text-[8px] text-muted-foreground font-body">/{goal}</div>
        </div>
      </div>
      {isComplete && (
        <div className="absolute -top-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg">
          <span className="text-primary-foreground text-sm">✓</span>
        </div>
      )}
    </div>
  )
}

function MealCard({
  meal,
  index,
  onDelete,
}: {
  meal: MealDisplay
  index: number
  onDelete: () => void
}) {
  const colorClasses = {
    emerald: "border-emerald-200/50 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-950/10",
    rose: "border-rose-200/50 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-950/10",
    amber: "border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10",
    sky: "border-sky-200/50 bg-sky-50/30 dark:border-sky-900/30 dark:bg-sky-950/10",
  }

  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] backdrop-blur-sm relative group`}
    >
      {/* Delete button - only visible on hover */}
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 w-9 h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-lg"
        aria-label={`Delete ${meal.title}`}
      >
        <Trash2 className="w-4 h-4 text-white" />
      </button>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
             
              <h3 className="truncate text-lg font-bold font-heading">{meal.title}</h3>
              {meal.analysisType === "image" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary font-body">
                  📷 AI
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
              <Flame className="h-4 w-4 text-amber-600" />
              <span className="tabular-nums font-semibold">{meal.kcal} kcal</span>
              <span className="opacity-60">•</span>
              <span className="tabular-nums">{meal.grams}</span>
              <span className="opacity-60">•</span>
              <time className="font-medium">{meal.timeLabel}</time>
            </div>
          </div>
          
        </div>

        {/* Macro chips with better spacing */}
        <div className="grid grid-cols-3 gap-3">
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
    <div className="flex h-14 items-center justify-between rounded-2xl border border-border/30 bg-card/70 px-3 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <span
          className="block h-2.5 w-2.5 rounded-full shadow-sm"
          style={{ backgroundColor: barColor }}
          aria-hidden="true"
        />
        <span className="text-xs font-medium text-muted-foreground font-body">{label}</span>
      </div>
      <span className="text-sm font-bold tabular-nums text-foreground font-heading">
        {value}
        <span className="ml-0.5 text-xs text-muted-foreground font-body">{unit}</span>
      </span>
    </div>
  )
}

function EmptyState({ onAddMeal }: { onAddMeal: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-8xl mb-6" role="img" aria-label="Empty plate">
        🍽️
      </div>
      <h3 className="text-2xl font-bold mb-3 font-heading">No meals tracked today</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-body leading-relaxed">
        Start tracking your nutrition by taking a photo of your food or adding meals manually.
      </p>
      <button
        onClick={onAddMeal}
        className="inline-flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-8 py-4 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 font-body"
      >
        <Camera className="h-5 w-5" />
        Add First Meal
      </button>
    </div>
  )
}
