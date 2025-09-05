/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  useMemo,
  useEffect,
  useState,
  useRef,
  useCallback,
  startTransition,
} from "react";
import type React from "react";

import { Camera, Droplet, Drumstick, Wheat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  useCurrentUser,
  useCurrentDayNutrition,
  useNutritionGoals,
  useProgressPercentages,
  useUserStore,
} from "@/store/user-store";
import CalariLoading from "@/components/ui/loading";
import {
  MealCard,
  MealDisplay,
  Ring,
  Stat,
} from "@/components/home/components";
import { useNotification } from "@/hooks/use-notifications";

// Helper function to convert food entry to meal display format
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
  const calendarScrollRef = useRef<HTMLDivElement>(null);

  // Store data
  const user = useCurrentUser();
  const currentDayNutrition = useCurrentDayNutrition();
  const goals = useNutritionGoals();
  const progressPercentages = useProgressPercentages();

  useEffect(() => {
    const askPermission = async () => {
      // Only ask if not already granted
      if (Notification.permission === "default") {
        try {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            console.log("✅ Notifications allowed");
          } else {
            console.log("❌ Notifications denied");
          }
        } catch (err) {
          console.error("Error requesting permission:", err);
        }
      } else {
        console.log(
          "ℹ️ Notification permission is already:",
          Notification.permission,
        );
      }
    };

    askPermission();
  }, []);
  // Store actions
  const calculateAndSaveDailyCalories = useUserStore(
    (state) => state.calculateAndSaveDailyCalories,
  );
  const fetchDayNutrition = useUserStore((state) => state.fetchDayNutrition);
  const removeFoodEntry = useUserStore((state) => state.removeFoodEntry);
  const setCurrentDate = useUserStore((state) => state.setCurrentDate);

  // Local state for delete confirmation
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoadingNutrition, setIsLoadingNutrition] = useState(false);
  const [isUpdatingStore, setIsUpdatingStore] = useState(false);

  const now = useMemo(() => new Date(), []);
  const displayDate = selectedDate ? new Date(selectedDate) : now;
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    displayDate,
  );

  const currentDate = now.toISOString().split("T")[0];
  const activeDate = selectedDate || currentDate;
  const isViewingCurrentDay = !selectedDate || selectedDate === currentDate;

  const calendarData = useMemo(() => {
    const today = new Date();
    const dates = [];

    // Generate last 30 days + today + next 7 days (38 days total)
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

  const meals = useMemo(() => {
    return currentDayNutrition.foodEntries.map((entry, index) =>
      convertFoodEntryToMeal(entry, index),
    );
  }, [currentDayNutrition.foodEntries]);

  const total = useMemo(
    () => ({
      kcal: Math.round(currentDayNutrition.totalCalories),
      protein: Math.round(currentDayNutrition.totalProtein),
      fat: Math.round(currentDayNutrition.totalFat),
      carbs: Math.round(currentDayNutrition.totalCarbs),
    }),
    [currentDayNutrition],
  );

  const pct = Math.round((total.kcal / goals.calories) * 100);
  const remainingCalories = Math.max(0, goals.calories - total.kcal);

  useEffect(() => {
    if (calendarScrollRef.current) {
      const todayIndex = calendarData.dates.findIndex((date) => date.isToday);
      if (todayIndex !== -1) {
        const scrollPosition =
          todayIndex * 80 - calendarScrollRef.current.clientWidth / 2 + 40;
        calendarScrollRef.current.scrollTo({
          left: scrollPosition,
          behavior: "smooth",
        });
      }
    }
  }, [calendarData.dates]);

  const loadTodaysData = useCallback(async () => {
    if (isLoaded && isSignedIn && user && !isUpdatingStore) {
      setIsUpdatingStore(true);
      try {
        const token = await getToken();
        if (token) {
          await fetchDayNutrition(activeDate, token);
        }
      } catch {
        // Handle error
      } finally {
        setIsUpdatingStore(false);
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

  useEffect(() => {
    loadTodaysData();
  }, []);

  useEffect(() => {
    const saveDailyCalories = async () => {
      if (
        isLoaded &&
        isSignedIn &&
        user &&
        meals.length > 0 &&
        isViewingCurrentDay
      ) {
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

    const timeoutId = setTimeout(saveDailyCalories, 2000);
    return () => clearTimeout(timeoutId);
  }, [
    meals.length,
    isLoaded,
    isSignedIn,
    user,
    currentDate,
    getToken,
    calculateAndSaveDailyCalories,
    isViewingCurrentDay,
  ]);

  const [deletingMealIds, setDeletingMealIds] = useState<Set<string>>(
    new Set(),
  );

  const handleDeleteMeal = useCallback(
    async (mealId: string) => {
      if (!isSignedIn || !user) return;

      // Check if already deleting
      if (deletingMealIds.has(mealId)) return;

      // Mark as deleting to start animation
      setDeletingMealIds((prev) => new Set(prev).add(mealId));

      try {
        const token = await getToken();
        if (token) {
          // Perform the actual deletion immediately (don't wait)
          await removeFoodEntry(activeDate, mealId, token);

          if ("vibrate" in navigator) {
            navigator.vibrate?.(50);
          }

          // Keep the deleting state for animation duration
          // The meal won't reappear because we keep it in deletingMealIds
          setTimeout(() => {
            setDeletingMealIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(mealId);
              return newSet;
            });
          }, 400); // Slightly longer to ensure store update is complete
        }
      } catch (error) {
        console.error("Failed to delete meal:", error);
        // Rollback: remove from deleting state immediately if deletion failed
        setDeletingMealIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(mealId);
          return newSet;
        });
      }
    },
    [isSignedIn, user, activeDate, getToken, removeFoodEntry],
  );

  const handleDateSelect = useCallback(
    async (dateString: string) => {
      if (!isSignedIn || !user) return;

      startTransition(() => {
        setIsLoadingNutrition(true);
        setSelectedDate(dateString);
      });

      // Handle async operations separately
    },
    [isSignedIn, user],
  );

  // Add separate effect for handling date changes
  useEffect(() => {
    if (selectedDate && isSignedIn && user) {
      const updateStoreData = async () => {
        try {
          const token = await getToken();
          if (token) {
            setCurrentDate(selectedDate);
            await fetchDayNutrition(selectedDate, token);
          }
        } catch {
          // Handle error
        } finally {
          setIsLoadingNutrition(false);
        }
      };
      updateStoreData();
    }
  }, [
    selectedDate,
    isSignedIn,
    user,
    getToken,
    setCurrentDate,
    fetchDayNutrition,
  ]);

  if (!isLoaded) {
    return <CalariLoading />;
  }

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
          <h3 className="text-2xl font-bold p-6 font-heading">
            Hi, {user?.profile.name?.split(" ")[0]}
          </h3>
        </header>

        <div className="z-40 mb-4 flex items-center justify-between px-4">
          <div
            ref={calendarScrollRef}
            className="flex gap-2 py-3 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            role="tablist"
            aria-label="Select date"
          >
            {calendarData.dates.map((dateItem) => (
              <button
                key={dateItem.date}
                onClick={() => handleDateSelect(dateItem.date)}
                role="tab"
                aria-label={`${dateItem.dayName} ${dateItem.monthName} ${dateItem.dayNumber}`}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  dateItem.date === activeDate
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : dateItem.isToday
                      ? "bg-primary/10 text-primary border-2 border-dotted border-primary/20"
                      : "bg-card/50 text-foreground hover:bg-card/80 border border-dotted border-border/30"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    dateItem.date === activeDate
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {dateItem.dayName}
                </div>
                <div
                  className={`text-lg font-bold ${
                    dateItem.date === activeDate
                      ? "text-primary-foreground"
                      : "text-foreground"
                  }`}
                >
                  {dateItem.dayNumber}
                </div>
              </button>
            ))}
          </div>
        </div>

        <section className="mx-auto max-w-screen-sm px-4 mt-2">
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/10 via-primary/5 to-transparent blur-3xl" />

            <div className="relative p-4 sm:p-6 space-y-6">
              {isLoadingNutrition ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-muted/20 border-t-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-body">
                      Loading nutrition data...
                    </p>
                  </div>
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

        <section
          aria-label="Tracked meals"
          className="mx-auto max-w-screen-sm px-4 pb-4 mt-4"
        >
          {isLoadingNutrition ? (
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
                {isViewingCurrentDay
                  ? "No meals tracked today"
                  : `No meals tracked on ${dayName}`}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-body leading-relaxed">
                {isViewingCurrentDay
                  ? "Start tracking your nutrition by taking a photo of your food or adding meals manually."
                  : "No nutrition data was recorded for this date. Try selecting a different date or return to today to start tracking."}
              </p>
              {isViewingCurrentDay && (
                <button
                  onClick={() => router.push("/track")}
                  className="inline-flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-8 py-3 font-semibold hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/25 font-body"
                >
                  <Camera className="h-5 w-5" />
                  Add First Meal
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
