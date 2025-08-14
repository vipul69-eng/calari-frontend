/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, X, Lightbulb, Calendar, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useUserStore } from "@/store/user-store"
import { useDailyMeals } from "@/hooks/use-meals"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

type Macros = { calories: number; fat: number; protein: number; carbs: number }

interface FoodAnalysisData {
  analysisResult: any;
  photoUrl?: string;
  analysisType: 'image' | 'text';
}

interface AddedItem {
  id: string;
  name: string;
  quantity: string;
  macros: Macros;
  reason: string;
}

export default function FoodAnalysisPage() {
  const router = useRouter();
  const [analysisData, setAnalysisData] = useState<FoodAnalysisData | null>(null);
  const { calculateAndSaveDailyCalories } = useUserStore()
  
  // Daily meals hook
  const {
    trackMeal,
    isSyncing,
    getDailySummary
  } = useDailyMeals();

  // State for added items
  const [addedItems, setAddedItems] = useState<AddedItem[]>([]);
  
  // Load analysis data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem('foodAnalysisData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setAnalysisData(parsed);
      } catch {
      }
    }
  }, []);

  // Extract food data from analysis result
  const food = useMemo(() => {
    if (analysisData?.analysisResult?.data?.foodItems?.[0]) {
      const foodItem = analysisData.analysisResult.data.foodItems[0];
      return { name: foodItem.name, quantity: foodItem.quantity };
    }
    return { name: "Avocado Toast", quantity: "1 slice" };
  }, [analysisData]);

  // Smart meal naming logic
  const mealName = useMemo(() => {
    if (addedItems.length === 0) return food.name;
    
    const addedNames = addedItems.map(item => item.name);
    
    if (addedItems.length === 1) {
      return `${food.name} with ${addedNames[0]}`;
    } else if (addedItems.length === 2) {
      return `${food.name}, ${addedNames[0]} & ${addedNames[1]}`;
    } else if (addedItems.length > 2) {
      return `${food.name} + ${addedItems.length} items`;
    }
    
    return food.name;
  }, [food.name, addedItems]);

  // Combined meal quantity (for display purposes)
  const combinedQuantity = useMemo(() => {
    if (addedItems.length === 0) return food.quantity;
    
    const addedQuantities = addedItems.map(item => `${item.quantity} ${item.name}`);
    return `${food.quantity} + ${addedQuantities.join(', ')}`;
  }, [food.quantity, addedItems]);

  // Extract base macros from analysis result
  const baseMacros: Macros = useMemo(() => {
    if (analysisData?.analysisResult?.data?.totalMacros) {
      const macros = analysisData.analysisResult.data.totalMacros;
      return {
        calories: macros.calories || 0,
        fat: macros.fat || 0,
        protein: macros.protein || 0,
        carbs: macros.carbs || 0
      };
    }
    return { calories: 250, fat: 18, protein: 6, carbs: 18 };
  }, [analysisData]);

  // Extract recommendation from analysis result
  const recommendation: "yes" | "no" = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion) {
      return analysisData.analysisResult.data.suggestion.shouldEat ? "yes" : "no";
    }
    return "yes";
  }, [analysisData]);

  // Get recommendation text from analysis result
  const recommendationText = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion?.reason) {
      return analysisData.analysisResult.data.suggestion.reason;
    }
    return recommendation === "yes"
      ? "Balanced choice with healthy fats and fiber. Consider adding protein to round it out."
      : "High in less desirable macros for your current goals. Try a leaner, more balanced option.";
  }, [analysisData, recommendation]);

  // Convert complementary foods to suggestions format
  const suggestions = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion?.mealCompletionSuggestions) {
      return analysisData.analysisResult.data.suggestion.mealCompletionSuggestions.map((item: any) => ({
        name: item.name,
        img: "/placeholder.svg?height=96&width=96",
        delta: item.macros,
        quantity: item.quantity,
        reason: item.reason
      }));
    }
    
    // Fallback suggestions
    return [
      {
        name: "Egg",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 70, fat: 5, protein: 6, carbs: 0 } as Macros,
        quantity: "1 large",
        reason: "High-quality protein"
      },
      {
        name: "Greek Yogurt",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 100, fat: 0, protein: 17, carbs: 6 },
        quantity: "1 cup",
        reason: "Protein and probiotics"
      },
      {
        name: "Mixed Nuts",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 170, fat: 15, protein: 6, carbs: 6 },
        quantity: "30g",
        reason: "Healthy fats"
      },
      {
        name: "Side Salad",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 60, fat: 4, protein: 2, carbs: 5 },
        quantity: "1 cup",
        reason: "Fiber and micronutrients"
      },
      {
        name: "Grilled Chicken",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 120, fat: 3, protein: 22, carbs: 0 },
        quantity: "100g",
        reason: "Lean protein"
      },
    ];
  }, [analysisData]);

  // Running totals for macros; start with base macros
  const [totals, setTotals] = useState<Macros>(baseMacros)

  // Update totals when base macros change
  useEffect(() => {
    setTotals(baseMacros);
  }, [baseMacros]);

  // Add-sheet state
  const [selected, setSelected] = useState<null | {
    name: string
    img: string
    delta: Macros
    reason: string
    quantity: string
  }>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { user } = useUserStore()
  
  // Daily summary for display

  const openAddSheet = useCallback((item: { name: string; img: string; delta: Macros, reason: string, quantity: string }) => {
    setSelected(item)
    setIsAddOpen(true)
  }, [])

  const closeAddSheet = useCallback(() => {
    setIsAddOpen(false)
    setTimeout(() => setSelected(null), 250)
  }, [])

  const onAdd = useCallback(async () => {
    if (!selected) return
    
    try {
      if ("vibrate" in navigator) navigator.vibrate?.([10, 15, 10])
    } catch {}

    // Generate unique ID for the added item
    const newItem: AddedItem = {
      id: crypto.randomUUID(),
      name: selected.name,
      quantity: selected.quantity,
      macros: selected.delta,
      reason: selected.reason
    };

    // Add to local state
    setAddedItems(prev => [...prev, newItem]);

    // Update local totals for UI
    setTotals((prev) => ({
      calories: prev.calories + selected.delta.calories,
      fat: prev.fat + selected.delta.fat,
      protein: prev.protein + selected.delta.protein,
      carbs: prev.carbs + selected.delta.carbs,
    }));

    closeAddSheet()
  }, [selected, closeAddSheet])

  // Remove item function
  const removeItem = useCallback(async (itemId: string) => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(5);
    } catch {}

    const itemToRemove = addedItems.find(item => item.id === itemId);
    if (!itemToRemove) return;

    // Remove from local state
    setAddedItems(prev => prev.filter(item => item.id !== itemId));

    // Update local totals
    setTotals(prev => ({
      calories: prev.calories - itemToRemove.macros.calories,
      fat: prev.fat - itemToRemove.macros.fat,
      protein: prev.protein - itemToRemove.macros.protein,
      carbs: prev.carbs - itemToRemove.macros.carbs,
    }));
  }, [addedItems]);

  const { getToken } = useAuth()

  const onTrack = useCallback(async () => {
  try {
    if ("vibrate" in navigator) navigator.vibrate?.(15)
  } catch {}

  // Get Clerk token
  const token = await getToken();

  // Track the complete meal as a single entry with combined name and totals
  await trackMeal(
    mealName, // Combined meal name
    combinedQuantity, // Combined quantity description
    totals, // Total macros including all added items
    analysisData?.analysisResult,
    analysisData?.photoUrl
    // Remove the token parameter from here
  );
const currentDate = new Date().toISOString().split('T')[0];

  // IMPORTANT: Update today's consumed calories by recalculating totals
  await calculateAndSaveDailyCalories(currentDate, token || undefined);

 

  // Navigate back or to dashboard
  router.push('/home');
}, [mealName, combinedQuantity, totals, trackMeal, calculateAndSaveDailyCalories, analysisData, router, food, addedItems, recommendation, getDailySummary])


  // Show loading state if no analysis data
  if (!analysisData) {
    return (
      <main className="relative min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading analysis data...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen bg-white text-neutral-900 dark:bg-black dark:text-neutral-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* Content */}
      <div className="mx-auto max-w-screen-sm px-4 pt-4 pb-24">
        {/* Food name + quantity with optional photo */}
        <section aria-label="Food header" className="mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">{mealName}</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{combinedQuantity}</p>
            </div>
            <div className="rounded-full bg-white/80 backdrop-blur px-3 py-1.5 border border-neutral-200 shadow-sm dark:bg-neutral-900/70 dark:border-neutral-800">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">Calari</span>
            </div>
          </div>

          {/* Show captured photo if available */}
          {analysisData.photoUrl && (
            <div className="relative h-48 w-full rounded-xl overflow-hidden border border-neutral-200 shadow-sm dark:border-neutral-800 mb-4">
              <Image
                src={analysisData.photoUrl}
                alt="Captured food photo"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
        </section>

        {/* Added Items Section */}
        {addedItems.length > 0 && (
          <section aria-label="Added items" className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Added Items</h3>
            <div className="space-y-2">
              {addedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-white/50 dark:border-neutral-800 dark:bg-neutral-900/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {item.quantity} • +{item.macros.calories} kcal
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-3 p-1.5 rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Current Meal Macros */}
        <section aria-label="Macronutrient breakdown" className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">This Meal</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MacroCard label="Calories" value={totals.calories} unit="kcal" />
            <MacroCard label="Fat" value={totals.fat} unit="g" />
            <MacroCard label="Protein" value={totals.protein} unit="g" />
            <MacroCard label="Carbs" value={totals.carbs} unit="g" />
          </div>
        </section>

        {/* Recommendation */}
        {user?.plan !== "basic" ? (
          <section aria-label="Recommendation" className="mb-6">
            <div
              className={`rounded-2xl border shadow-sm p-4 flex items-start gap-3 ${
                recommendation === "yes"
                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                  : "border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30"
              }`}
            >
              {recommendation === "yes" ? (
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              ) : (
                <X className="h-6 w-6 text-rose-600 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {recommendation === "yes" ? "Recommended: Yes" : "Recommended: No"}
                </div>
                <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                  {recommendationText}
                </p>
                {analysisData?.analysisResult?.data?.suggestion?.recommendedQuantity && (
                  <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                    <strong>Recommended quantity:</strong> {analysisData.analysisResult.data.suggestion.recommendedQuantity}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {/* Completeness Suggestions */}
        {user?.plan !== "basic" ? (
          <section aria-label="Completeness suggestions" className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-semibold">
                {recommendation === "yes" ? "Make it a complete meal" : "Healthy alternatives"}
              </h2>
            </div>

            <div className="-mx-4 px-4">
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1">
                {suggestions.map((s: any, index: any) => (
                  <button
                    key={`${s.name}-${index}`}
                    onClick={() => openAddSheet(s)}
                    className="snap-start w-[128px] shrink-0 rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-sm shadow-sm p-3 text-left transition hover:shadow-md active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                      <Image
                        src={s.img || "/placeholder.svg"}
                        alt={s.name}
                        fill
                        className="object-cover"
                        unoptimized={s.img?.startsWith("blob:")}
                        sizes="128px"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-sm font-medium text-neutral-800 truncate dark:text-neutral-100">
                        {s.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">Add Food</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Track Button */}
        <div className="h-2" />
        <Button
          className="w-full h-12 rounded-xl bg-black text-white hover:bg-black/90 shadow-lg dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50"
          onClick={onTrack}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Tracking...
            </div>
          ) : (
            'Track Meal'
          )}
        </Button>
      </div>

      {/* Add Food bottom-sheet overlay */}
      <div
        className={`fixed inset-0 z-50 ${isAddOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isAddOpen}
      >
        {/* Scrim */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            isAddOpen ? "opacity-100" : "opacity-0"
          } bg-black/30 backdrop-blur-sm`}
          onClick={closeAddSheet}
        />
        {/* Sheet */}
        <div
          className={`absolute inset-x-0 bottom-0 transform transition-transform duration-300 ease-out ${
            isAddOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div
            className="mx-auto w-full max-w-screen-sm rounded-t-3xl bg-white/90 backdrop-blur-md shadow-2xl border-t border-neutral-200 dark:bg-neutral-900/90 dark:border-neutral-800"
            style={{
              height: "50vh",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="relative flex items-center px-4 pt-3 pb-2">
              <div
                className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700"
                aria-hidden="true"
              />
              <button
                type="button"
                aria-label="Close"
                onClick={closeAddSheet}
                className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="h-[calc(50vh-56px)] overflow-auto px-4 pb-4">
              {selected ? (
                <div className="space-y-4">
                  {/* Selected item */}
                  <div className="flex items-start gap-3">
                    <Image
                      src={selected.img || "/placeholder.svg"}
                      alt={selected.name}
                      width={64}
                      height={64}
                      className="h-16 w-16 rounded-lg object-cover border border-neutral-200 shadow-sm dark:border-neutral-800"
                      style={{ objectFit: "cover" }}
                      unoptimized={selected.img?.startsWith("blob:")}
                    />
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                        {selected.name}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selected.reason}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400">
                        {selected.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Deltas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DeltaBadge label="Calories" value={selected.delta.calories} unit="kcal" />
                    <DeltaBadge label="Fat" value={selected.delta.fat} unit="g" />
                    <DeltaBadge label="Protein" value={selected.delta.protein} unit="g" />
                    <DeltaBadge label="Carbs" value={selected.delta.carbs} unit="g" />
                  </div>

                  {/* Add button */}
                  <Button
                    className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 shadow-sm dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                    onClick={onAdd}
                  >
                    Add to Meal
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

function MacroCard({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string
  value: number
  unit: string
  tone?: "neutral" | "amber" | "rose" | "emerald" | "sky"
}) {
  const map = {
    neutral: {
      ring: "border-neutral-200 dark:border-neutral-800",
      bg: "bg-white/90 dark:bg-neutral-900/60",
      sub: "text-neutral-500 dark:text-neutral-400",
      text: "text-neutral-900 dark:text-neutral-100",
      chip: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
    amber: {
      ring: "border-amber-200/80 dark:border-amber-900/50",
      bg: "bg-amber-50/70 dark:bg-amber-950/30",
      sub: "text-amber-700/80 dark:text-amber-300/90",
      text: "text-amber-900 dark:text-amber-100",
      chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    },
    rose: {
      ring: "border-rose-200/80 dark:border-rose-900/50",
      bg: "bg-rose-50/70 dark:bg-rose-950/30",
      sub: "text-rose-700/80 dark:text-rose-300/90",
      text: "text-rose-900 dark:text-rose-100",
      chip: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    },
    emerald: {
      ring: "border-emerald-200/80 dark:border-emerald-900/50",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
      sub: "text-emerald-700/80 dark:text-emerald-300/90",
      text: "text-emerald-900 dark:text-emerald-100",
      chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    sky: {
      ring: "border-sky-200/80 dark:border-sky-900/50",
      bg: "bg-sky-50/70 dark:bg-sky-950/30",
      sub: "text-sky-700/80 dark:text-sky-300/90",
      text: "text-sky-900 dark:text-sky-100",
      chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    },
  }[tone]

  return (
    <div className={["rounded-xl border shadow-sm p-3", map.ring, map.bg].join(" ")}>
      <div className="flex items-center justify-between">
        <div className={["text-xs font-medium", map.sub].join(" ")}>{label}</div>
        <div className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", map.chip].join(" ")}>{unit}</div>
      </div>
      <div className={["mt-1 text-2xl font-semibold tabular-nums", map.text].join(" ")}>{value}</div>
    </div>
  )
}

function DeltaBadge({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string
  value: number
  unit: string
  tone?: "neutral" | "amber" | "rose" | "emerald" | "sky"
}) {
  const map = {
    neutral: {
      ring: "border-neutral-200 dark:border-neutral-800",
      bg: "bg-white/90 dark:bg-neutral-900/60",
      sub: "text-neutral-500 dark:text-neutral-400",
      text: "text-neutral-900 dark:text-neutral-100",
      chip: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
    amber: {
      ring: "border-amber-200/80 dark:border-amber-900/50",
      bg: "bg-amber-50/70 dark:bg-amber-950/30",
      sub: "text-amber-700/80 dark:text-amber-300/90",
      text: "text-amber-900 dark:text-amber-100",
      chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    },
    rose: {
      ring: "border-rose-200/80 dark:border-rose-900/50",
      bg: "bg-rose-50/70 dark:bg-rose-950/30",
      sub: "text-rose-700/80 dark:text-rose-300/90",
      text: "text-rose-900 dark:text-rose-100",
      chip: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    },
    emerald: {
      ring: "border-emerald-200/80 dark:border-emerald-900/50",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
      sub: "text-emerald-700/80 dark:text-emerald-300/90",
      text: "text-emerald-900 dark:text-emerald-100",
      chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    sky: {
      ring: "border-sky-200/80 dark:border-sky-900/50",
      bg: "bg-sky-50/70 dark:bg-sky-950/30",
      sub: "text-sky-700/80 dark:text-sky-300/90",
      text: "text-sky-900 dark:text-sky-100",
      chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    },
  }[tone]

  return (
    <div className={["rounded-xl border shadow-sm p-3", map.ring, map.bg].join(" ")}>
      <div className="flex items-center justify-between">
        <div className={["text-xs font-medium", map.sub].join(" ")}>{label}</div>
        <div className={["rounded-full px-2 py-0.5 text-[10px] font-semibold", map.chip].join(" ")}>{unit}</div>
      </div>
      <div className={["mt-1 text-xl font-semibold tabular-nums", map.text].join(" ")}>
        {value >= 0 ? "+" : ""}
        {value}
      </div>
    </div>
  )
}
