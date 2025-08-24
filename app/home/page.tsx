/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useMemo, useEffect, useState } from "react"
import type React from "react"

import { Camera, Flame, Trash2, Calendar, X, Apple } from "lucide-react"
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
import CalariLoading from "@/components/ui/loading"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
  const setCurrentDate = useUserStore((state) => state.setCurrentDate)

  // Local state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false)
  const { mealsScanned } = useMealCountStore()

  const now = useMemo(() => new Date(), [])
  const displayDate = selectedDate ? new Date(selectedDate) : now
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(displayDate)
  const fullDate = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "long" }).format(displayDate)
  const currentDate = now.toISOString().split("T")[0]
  const activeDate = selectedDate || currentDate
  const isViewingCurrentDay = !selectedDate || selectedDate === currentDate

  const calendarData = useMemo(() => {
    const today = new Date()
    const dates = []

    // Generate last 10 days + today (11 days total)
    for (let i = 10; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      const isToday = i === 0
      const dayName = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)
      const dayNumber = date.getDate()
      const monthName = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)

      dates.push({
        date: date.toISOString().split("T")[0],
        dayName,
        dayNumber,
        monthName,
        isToday,
        fullDate: date,
      })
    }

    return { dates }
  }, [])

  const meals = useMemo(() => {
    return currentDayNutrition.foodEntries.map((entry, index) => convertFoodEntryToMeal(entry, index))
  }, [currentDayNutrition.foodEntries])

  const total = useMemo(
    () => ({
      kcal: Math.round(currentDayNutrition.totalCalories),
      protein: Math.round(currentDayNutrition.totalProtein),
      fat: Math.round(currentDayNutrition.totalFat),
      carbs: Math.round(currentDayNutrition.totalCarbs),
    }),
    [currentDayNutrition],
  )

  const pct = Math.min(100, Math.round((total.kcal / goals.calories) * 100))

  useEffect(() => {
    const loadTodaysData = async () => {
      if (isLoaded && isSignedIn && user) {
        try {
          const token = await getToken()
          if (token) {
            await fetchDayNutrition(activeDate, token)
          }
        } catch {
          // Silently handle error
        }
      }
    }

    loadTodaysData()
  }, [isLoaded, isSignedIn, user, activeDate, getToken, fetchDayNutrition])

  useEffect(() => {
    const saveDailyCalories = async () => {
      if (isLoaded && isSignedIn && user && meals.length > 0 && isViewingCurrentDay) {
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

    const timeoutId = setTimeout(saveDailyCalories, 2000)
    return () => clearTimeout(timeoutId)
  }, [
    meals.length,
    isLoaded,
    isSignedIn,
    user,
    currentDate,
    getToken,
    calculateAndSaveDailyCalories,
    isViewingCurrentDay,
  ])

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

  const handleDeleteMeal = async (mealId: string) => {
    if (!isSignedIn || !user || isDeleting) return

    setIsDeleting(true)
    try {
      const token = await getToken()
      if (token) {
        await removeFoodEntry(activeDate, mealId, token)
        if ("vibrate" in navigator) {
          navigator.vibrate?.(50)
        }
      }
    } catch (error) {
      console.error("Failed to delete meal:", error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(null)
    }
  }

  const handleDateSelect = async (dateString: string) => {
    if (!isSignedIn || !user) return

    setIsLoadingNutrition(true)
    setSelectedDate(dateString)

    try {
      const token = await getToken()
      if (token) {
        setCurrentDate(dateString)
        await fetchDayNutrition(dateString, token)
      }
    } catch {
      // Silently handle error
    } finally {
      setIsLoadingNutrition(false)
    }
  }

  const handleResetToCurrentDate = async () => {
    setIsLoadingNutrition(true)
    setSelectedDate(null)

    if (!isSignedIn || !user) return

    try {
      const token = await getToken()
      if (token) {
        setCurrentDate(currentDate)
        await fetchDayNutrition(currentDate, token)
      }
    } catch {
      // Silently handle error
    } finally {
      setIsLoadingNutrition(false)
    }
  }

  if (!isLoaded) {
    return <CalariLoading />
  }

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
                {!isViewingCurrentDay && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Past</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Open calendar"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 border border-border/50 backdrop-blur-sm bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all duration-200 data-[state=open]:bg-primary data-[state=open]:text-primary-foreground"
                  >
                    <Calendar className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                  <div className="bg-card/95 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground font-heading">Calari Calendar</h3>
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        {calendarData.dates.map((dateItem) => (
                          <button
                            key={dateItem.date}
                            onClick={() => handleDateSelect(dateItem.date)}
                            className={`flex flex-col items-center p-3 rounded-xl text-center transition-all duration-200 hover:bg-muted/50 ${
                              dateItem.date === activeDate
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-foreground hover:bg-muted/30"
                            }`}
                          >
                            <div
                              className={`text-lg font-bold ${dateItem.date === activeDate ? "text-primary-foreground" : "text-foreground"}`}
                            >
                              {dateItem.dayNumber}
                            </div>
                            <div
                              className={`text-xs font-medium ${dateItem.date === activeDate ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                            >
                              {dateItem.monthName}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

       <button
  aria-label={isViewingCurrentDay ? "Open camera" : "Return to today"}
  onClick={isViewingCurrentDay ? () => router.push("/track") : handleResetToCurrentDate}
  className="fixed bottom-26 right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-lg shadow-primary/25 z-[999]"
>
  <span className="flex items-center justify-center h-8 w-8">
    {isViewingCurrentDay ? <Camera className="h-8 w-8" /> : <X className="h-8 w-8" />}
  </span>
</button>


        <section className="mx-auto max-w-screen-sm px-4 mt-2">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-background/50 to-muted/30 shadow-xl backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/10 via-primary/5 to-transparent blur-3xl" />

            <div className="relative p-4 sm:p-6 space-y-6">
              {isLoadingNutrition ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-muted/20 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-body">Loading nutrition data...</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Ring
                    value={pct}
                    center={`${total.kcal}`}
                    sub="kcal"
                    goal={goals.calories}
                    remaining={goals.calories - total.kcal}
                  />
                </div>
              )}

              {isLoadingNutrition ? (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30"
                    >
                      <div className="animate-pulse">
                        <div className="h-6 w-12 bg-muted/50 rounded mb-1" />
                        <div className="h-3 w-8 bg-muted/30 rounded" />
                      </div>
                      <div className="w-full">
                        <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                          <div className="h-full bg-muted/40 animate-pulse rounded-full w-1/2" />
                        </div>
                        <div className="h-3 w-8 bg-muted/30 rounded mt-1 mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <Stat value={total.protein} label="Protein" progress={progressPercentages.protein} color="emerald" />
                  <Stat value={total.fat} label="Fat" progress={progressPercentages.fat} color="rose" />
                  <Stat value={total.carbs} label="Carbs" progress={progressPercentages.carbs} color="sky" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section aria-label="Tracked meals" className="mx-auto max-w-screen-sm px-4 pb-4 mt-4 ">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold font-heading">
              {isViewingCurrentDay ? "Today's Meals" : `${dayName}'s Meals`}
            </h2>
            {!currentDayNutrition.synced && meals.length > 0 && !isLoadingNutrition && (
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-200 font-body">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Syncing...
              </span>
            )}
          </div>

          {isLoadingNutrition ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border p-5 shadow-sm backdrop-blur-sm animate-pulse">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <div className="h-6 bg-muted/50 rounded-lg w-3/4 mb-2" />
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-4 bg-muted/40 rounded" />
                        <div className="h-4 bg-muted/40 rounded w-16" />
                        <div className="h-4 bg-muted/40 rounded w-12" />
                        <div className="h-4 bg-muted/40 rounded w-12" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-14 rounded-2xl border border-border/30 bg-card/70 p-3 animate-pulse">
                        <div className="h-3 bg-muted/40 rounded w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <MealCard key={meal.id} meal={meal} index={index} onDelete={() => setShowDeleteConfirm(meal.id)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="text-8xl mb-6" role="img" aria-label="Empty plate">
                🍽️
              </div>
              <h3 className="text-2xl font-bold mb-3 font-heading">
                {isViewingCurrentDay ? "No meals tracked today" : `No meals tracked on ${dayName}`}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-body leading-relaxed">
                {isViewingCurrentDay
                  ? "Start tracking your nutrition by taking a photo of your food or adding meals manually."
                  : "No nutrition data was recorded for this date. Try selecting a different date or return to today to start tracking."}
              </p>
              {isViewingCurrentDay && (
                <button
                  onClick={() => router.push("/track")}
                  className="inline-flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-8 py-4 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 font-body"
                >
                  <Camera className="h-5 w-5" />
                  Add First Meal
                </button>
              )}
            </div>
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

interface StatProps {
  value: number
  label: string
  progress: number // percentage (0-100)
  color: "emerald" | "rose" | "sky"
}

const colorClasses = {
  emerald: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500",
    bgLight: "bg-emerald-100 dark:bg-emerald-900/20",
  },
  rose: {
    text: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500",
    bgLight: "bg-rose-100 dark:bg-rose-900/20",
  },
  sky: {
    text: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500",
    bgLight: "bg-sky-100 dark:bg-sky-900/20",
  },
}

const Stat: React.FC<StatProps> = ({ value, label, progress, color }) => {
  const colors = colorClasses[color]

  return (
    <div className="flex flex-col items-center space-y-2 p-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30">
      <div className="text-center">
        <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>{value}g</div>
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
      </div>

      <div className="w-full">
        <div className={`h-2 rounded-full ${colors.bgLight} overflow-hidden`}>
          <div
            className={`h-full ${colors.bg} transition-all duration-500 ease-out rounded-full`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1">{Math.round(progress)}%</div>
      </div>
    </div>
  )
}

interface RingProps {
  value: number // percentage (0-100)
  center: string // display value in center
  sub: string // subtitle text
  goal: number // target goal
  remaining: number // remaining amount
}

const Ring: React.FC<RingProps> = ({ value, center, sub, goal, remaining }) => {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted/20"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-primary transition-all duration-500 ease-out"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-bold text-foreground">{center}</span>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">{sub}</span>
        </div>
      </div>

      <div className="mt-2 text-center">
        <div className="text-xs text-muted-foreground">
          Goal: {goal} • Remaining: {remaining}
        </div>
      </div>
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
      <button
        onClick={onDelete}
        className="absolute top-3 right-3 w-9 h-9 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl flex items-center justify-center opacity-100 transition-all duration-200 z-10 shadow-lg"
        aria-label={`Delete ${meal.title}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="truncate text-lg font-bold font-heading max-w-70">{meal.title}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
              <Flame className="h-4 w-4 text-amber-600" />
              <span className="tabular-nums font-semibold">{meal.kcal} kcal</span>
              <span className="opacity-60">•</span>
              <span className="tabular-nums">{meal.grams.replace(/$$.*?$$/g, "").trim()}</span>
              <span className="opacity-60">•</span>
              <time className="font-medium">{meal.timeLabel}</time>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MacroChip label="P" value={meal.macros.protein} unit="g" barColor="#10b981" />
          <MacroChip label="F" value={meal.macros.fat} unit="g" barColor="#f43f5e" />
          <MacroChip label="C" value={meal.macros.carbs} unit="g" barColor="#0ea5e9" />
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
