/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { Camera, Droplet, Drumstick, Flame, Wheat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  MealCard,
  type MealDisplay,
  Ring,
  Stat,
} from "@/components/home/components";
import {
  useCurrentDayNutrition,
  useCurrentUser,
  useNutritionGoals,
  useNutritionStore,
  useProgressPercentages,
} from "@/store";

// Helper: convert food entry to meal display
const convertFoodEntryToMeal = (entry: any, index: number): MealDisplay => {
  const colors: ("emerald" | "rose" | "amber" | "sky")[] = [
    "emerald",
    "sky",
    "amber",
    "rose",
  ];
  const emojis = ["🥗"];
  const createdTime = new Date(entry.createdAt);
  const timeLabel = createdTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
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
      carbs: Math.round(Number(entry.carbs)),
    },
    emoji: emojis[index % emojis.length],
    color: colors[index % colors.length],
    analysisType: entry.analysisType,
  };
};

export default function MainPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  // Store data (read-only selectors; no state updates during render)
  const user = useCurrentUser();
  const currentDayNutrition = useCurrentDayNutrition();
  const goals = useNutritionGoals();
  const progressPercentages = useProgressPercentages();

  // Refs
  const calendarScrollRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);
  const [deletingMealIds, setDeletingMealIds] = useState<Set<string>>(
    () => new Set(),
  );

  // Memoized "now" and derived dates
  const now = useMemo(() => new Date(), []);
  const currentDate = useMemo(() => now.toISOString().split("T")[0], [now]);
  const activeDate = currentDate;

  // Calendar strip data (past 7 days to today)
  const calendarData = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const isToday = i === 0;
      const dayName = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
      }).format(date);
      const dayNumber = date.getDate();
      const monthName = new Intl.DateTimeFormat("en-US", {
        month: "short",
      }).format(date);
      dates.push({
        date: date.toISOString().split("T")[0],
        dayName,
        dayNumber,
        monthName,
        isToday,
        fullDate: date,
      });
    }
    return { dates };
  }, []);

  // Meals and totals derived from store data only (pure)
  const meals = useMemo(
    () =>
      currentDayNutrition.foodEntries.map((entry, index) =>
        convertFoodEntryToMeal(entry, index),
      ),
    [currentDayNutrition.foodEntries],
  );

  const total = useMemo(
    () => ({
      kcal: Math.round(currentDayNutrition.totalCalories),
      protein: Math.round(currentDayNutrition.totalProtein),
      fat: Math.round(currentDayNutrition.totalFat),
      carbs: Math.round(currentDayNutrition.totalCarbs),
    }),
    [currentDayNutrition],
  );

  const pct = useMemo(() => {
    const denom = Math.max(1, goals.calories);
    return Math.round((total.kcal / denom) * 100);
  }, [total.kcal, goals.calories]);

  const remainingCalories = useMemo(
    () => Math.max(0, goals.calories - total.kcal),
    [goals.calories, total.kcal],
  );

  // Store actions (selectors)
  const calculateAndSaveDailyCalories = useNutritionStore(
    (state) => state.calculateAndSaveDailyCalories,
  );
  const fetchDayNutrition = useNutritionStore(
    (state) => state.fetchDayNutrition,
  );
  const removeFoodEntry = useNutritionStore((state) => state.removeFoodEntry);
  const fetchMealHistory = useNutritionStore((state) => state.fetchMealHistory);
  const calculateStreak = useNutritionStore((state) => state.calculateStreak);
  const streak = useNutritionStore((state) => state.streak);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Ask Notification permission safely (in effect, guarded by browser support)
  useEffect(() => {
    let cancelled = false;
    const askPermission = async () => {
      try {
        if (typeof window === "undefined" || !("Notification" in window)) {
          return;
        }
        if (Notification.permission === "default") {
          const permission = await Notification.requestPermission();
          if (cancelled || !isMountedRef.current) return;
        }
      } catch {
        // No-op
      }
    };
    askPermission();
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll calendar to today on mount
  useEffect(() => {
    const el = calendarScrollRef.current;
    if (!el) return;
    const todayIndex = calendarData.dates.findIndex((date) => date.isToday);
    if (todayIndex !== -1) {
      const scrollPosition = todayIndex * 80 - el.clientWidth / 2 + 40;
      el.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  }, [calendarData.dates]);

  const loadMealsFirst = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user || isUpdatingStore) return;

    if (!isMountedRef.current) return;
    setIsLoadingMeals(true);

    try {
      const token = await getToken();
      if (token && isMountedRef.current) {
        // Priority 1: Load meal data first for immediate display
        await fetchDayNutrition(activeDate, token);
      }
    } catch (error) {
      console.error("Failed to load meals:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMeals(false);
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    activeDate,
    getToken,
    fetchDayNutrition,
    isUpdatingStore,
  ]);

  const loadSecondaryData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !user || isUpdatingStore) return;

    if (!isMountedRef.current) return;
    setIsLoadingNutrition(true);

    try {
      const token = await getToken();
      if (token && isMountedRef.current) {
        // Priority 2: Load meal history and calculate streak
        await fetchMealHistory({}, token);
        if (isMountedRef.current) {
          calculateStreak();
        }
      }
    } catch (error) {
      console.error("Failed to load secondary data:", error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingNutrition(false);
      }
    }
  }, [
    isLoaded,
    isSignedIn,
    user,
    getToken,
    fetchMealHistory,
    calculateStreak,
    isUpdatingStore,
  ]);

  useEffect(() => {
    const loadData = async () => {
      await loadMealsFirst();
      // Small delay to ensure meals render first
      setTimeout(() => {
        if (isMountedRef.current) {
          loadSecondaryData();
        }
      }, 100);
    };

    loadData();
  }, [loadMealsFirst, loadSecondaryData]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (meals.length === 0) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let cancelled = false;

    const run = async () => {
      if (cancelled || !isMountedRef.current) return;

      try {
        const token = await getToken();
        if (token && !cancelled && isMountedRef.current) {
          await calculateAndSaveDailyCalories(currentDate, token);
        }
      } catch (error) {
        console.error("Failed to save daily calories:", error);
      }
    };

    timeoutId = setTimeout(run, 800);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    meals.length,
    isLoaded,
    isSignedIn,
    user,
    currentDate,
    getToken,
    calculateAndSaveDailyCalories,
  ]);

  const handleDeleteMeal = useCallback(
    async (mealId: string) => {
      if (!isSignedIn || !user || !isMountedRef.current) return;
      if (deletingMealIds.has(mealId)) return;

      setDeletingMealIds((prev) => {
        const set = new Set(prev);
        set.add(mealId);
        return set;
      });

      try {
        const token = await getToken();
        if (token && isMountedRef.current) {
          await removeFoodEntry(activeDate, mealId, token);
          if ("vibrate" in navigator) {
            navigator.vibrate?.(50);
          }
        }
      } catch (error) {
        console.error("Failed to delete meal:", error);
        // Rollback the deleting state if deletion failed
        if (isMountedRef.current) {
          setDeletingMealIds((prev) => {
            const set = new Set(prev);
            set.delete(mealId);
            return set;
          });
        }
        return;
      }

      // Ensure the deleting flag clears after animation
      setTimeout(() => {
        if (isMountedRef.current) {
          setDeletingMealIds((prev) => {
            const set = new Set(prev);
            set.delete(mealId);
            return set;
          });
        }
      }, 400);
    },
    [isSignedIn, user, activeDate, getToken, removeFoodEntry, deletingMealIds],
  );

  if (!isSignedIn || !user) {
    return (
      <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🍎</div>
          <h1 className="text-2xl font-bold font-heading">Welcome to Calari</h1>
          <p className="text-lg text-muted-foreground font-body">
            Please sign in to track your nutrition
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition font-body"
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
        className="relative min-h-screen bg-background text-foreground pb-36"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <header className="sticky z-30">
          <div className="flex items-center justify-between p-6">
            <h3 className="text-3xl font-bold font-heading">
              Hi, {user?.profile.name?.split(" ")[0]?.slice(0, 16)}
            </h3>
            {streak >= 0 && (
              <div className="flex items-center gap-2 bg-neutral-800 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                <Flame color="orange" className="h-4 w-4" />
                <span>
                  {streak} day{streak !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Summary ring */}
        <section className="mx-auto max-w-screen-sm px-4 mt-2">
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/10 via-primary/5 to-transparent blur-3xl" />
            <div className="relative p-4 sm:p-6 space-y-6">
              {isLoadingMeals ? (
                <div className="flex items-center justify-center py-8">
                  {/*<div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-muted/20 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-body">
                      Loading meals...
                    </p>
                  </div>*/}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-8">
                  <Ring
                    value={pct}
                    center={`${total.kcal}`}
                    sub="kcal"
                    goal={goals.calories}
                    remaining={remainingCalories}
                  />
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-muted-foreground">
                      {Math.round(remainingCalories)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      remaining
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1">
                      of {Math.round(goals.calories)}
                    </div>
                  </div>
                </div>
              )}

              {/* Macro stats */}
              {isLoadingMeals ? (
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
                        <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                          <div className="h-full bg-muted/40 animate-pulse rounded-full w-1/2" />
                        </div>
                        <div className="h-3 w-8 bg-muted/30 rounded mt-1 mx-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <Stat
                    value={total.protein}
                    label="Protein"
                    progress={progressPercentages.protein}
                    color="emerald"
                    icon={Drumstick}
                  />
                  <Stat
                    value={total.fat}
                    label="Fat"
                    progress={progressPercentages.fat}
                    color="rose"
                    icon={Droplet}
                  />
                  <Stat
                    value={total.carbs}
                    label="Carbs"
                    progress={progressPercentages.carbs}
                    color="sky"
                    icon={Wheat}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Meals list - Priority display */}
        <section
          aria-label="Tracked meals"
          className="mx-auto max-w-screen-sm px-4 pb-4 mt-4"
        >
          {isLoadingMeals ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-3xl border p-5 shadow-sm backdrop-blur-sm animate-pulse"
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="min-w-0 flex-1 text-center">
                      <div className="h-6 bg-muted/50 rounded-lg w-3/4 mb-2 mx-auto" />
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-4 w-4 bg-muted/40 rounded" />
                        <div className="h-4 bg-muted/40 rounded w-16" />
                        <div className="h-4 bg-muted/40 rounded w-12" />
                        <div className="h-4 bg-muted/40 rounded w-12" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-14 rounded-2xl border border-border/30 bg-card/70 p-3 animate-pulse"
                      >
                        <div className="h-3 bg-muted/40 rounded w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : meals.length > 0 ? (
            <div className="space-y-4">
              {meals.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  deleteMeal={() => handleDeleteMeal(meal.id)}
                  isDeleting={deletingMealIds.has(meal.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4">
              <div
                className="text-8xl mb-6"
                role="img"
                aria-label="Empty plate"
              >
                🍽️
              </div>
              <h3 className="text-2xl font-bold mb-3 font-heading">
                No meals tracked today
              </h3>

              <button
                onClick={() => router.push("/track")}
                className="inline-flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-8 py-3 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 font-body"
              >
                <Camera className="h-5 w-5" />
                Add First Meal
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
