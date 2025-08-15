/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { CheckCircle2, X, Lightbulb, TrendingUp, Sparkles, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useUserStore } from "@/store/user-store"
import { useDailyMeals } from "@/hooks/use-meals"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

type Macros = { calories: number; fat: number; protein: number; carbs: number }

interface FoodAnalysisData {
  analysisResult: any
  photoUrl?: string
  analysisType: "image" | "text"
}

interface AddedItem {
  id: string
  name: string
  quantity: string
  macros: Macros
  reason: string
}

export default function FoodAnalysisPage() {
  const router = useRouter()
  const [analysisData, setAnalysisData] = useState<FoodAnalysisData | null>(null)
  const { calculateAndSaveDailyCalories } = useUserStore()

  // Daily meals hook
  const { trackMeal, isSyncing, getDailySummary } = useDailyMeals()

  // State for added items
  const [addedItems, setAddedItems] = useState<AddedItem[]>([])

  // Load analysis data from sessionStorage
  useEffect(() => {
    const storedData = sessionStorage.getItem("foodAnalysisData")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        setAnalysisData(parsed)
      } catch {}
    }
  }, [])

  // Extract food data from analysis result
  const food = useMemo(() => {
    if (analysisData?.analysisResult?.data?.foodItems?.[0]) {
      const foodItem = analysisData.analysisResult.data.foodItems[0]
      return { name: foodItem.name, quantity: foodItem.quantity }
    }
    return { name: "Avocado Toast", quantity: "1 slice" }
  }, [analysisData])

  // Smart meal naming logic
  const mealName = useMemo(() => {
    if (addedItems.length === 0) return food.name

    const addedNames = addedItems.map((item) => item.name)

    if (addedItems.length === 1) {
      return `${food.name} with ${addedNames[0]}`
    } else if (addedItems.length === 2) {
      return `${food.name}, ${addedNames[0]} & ${addedNames[1]}`
    } else if (addedItems.length > 2) {
      return `${food.name} + ${addedItems.length} items`
    }

    return food.name
  }, [food.name, addedItems])

  // Combined meal quantity (for display purposes)
  const combinedQuantity = useMemo(() => {
    if (addedItems.length === 0) return food.quantity

    const addedQuantities = addedItems.map((item) => `${item.quantity} ${item.name}`)
    return `${food.quantity} + ${addedQuantities.join(", ")}`
  }, [food.quantity, addedItems])

  // Extract base macros from analysis result
  const baseMacros: Macros = useMemo(() => {
    if (analysisData?.analysisResult?.data?.totalMacros) {
      const macros = analysisData.analysisResult.data.totalMacros
      return {
        calories: macros.calories || 0,
        fat: macros.fat || 0,
        protein: macros.protein || 0,
        carbs: macros.carbs || 0,
      }
    }
    return { calories: 250, fat: 18, protein: 6, carbs: 18 }
  }, [analysisData])

  // Extract recommendation from analysis result
  const recommendation: "yes" | "no" = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion) {
      return analysisData.analysisResult.data.suggestion.shouldEat ? "yes" : "no"
    }
    return "yes"
  }, [analysisData])

  // Get recommendation text from analysis result
  const recommendationText = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion?.reason) {
      return analysisData.analysisResult.data.suggestion.reason
    }
    return recommendation === "yes"
      ? "Balanced choice with healthy fats and fiber. Consider adding protein to round it out."
      : "High in less desirable macros for your current goals. Try a leaner, more balanced option."
  }, [analysisData, recommendation])

  // Convert complementary foods to suggestions format
  const suggestions = useMemo(() => {
    if (analysisData?.analysisResult?.data?.suggestion?.mealCompletionSuggestions) {
      return analysisData.analysisResult.data.suggestion.mealCompletionSuggestions.map((item: any) => ({
        name: item.name,
        img: "/placeholder.svg?height=96&width=96",
        delta: item.macros,
        quantity: item.quantity,
        reason: item.reason,
      }))
    }

    // Fallback suggestions
    return [
      {
        name: "Egg",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 70, fat: 5, protein: 6, carbs: 0 } as Macros,
        quantity: "1 large",
        reason: "High-quality protein",
      },
      {
        name: "Greek Yogurt",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 100, fat: 0, protein: 17, carbs: 6 },
        quantity: "1 cup",
        reason: "Protein and probiotics",
      },
      {
        name: "Mixed Nuts",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 170, fat: 15, protein: 6, carbs: 6 },
        quantity: "30g",
        reason: "Healthy fats",
      },
      {
        name: "Side Salad",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 60, fat: 4, protein: 2, carbs: 5 },
        quantity: "1 cup",
        reason: "Fiber and micronutrients",
      },
      {
        name: "Grilled Chicken",
        img: "/placeholder.svg?height=96&width=96",
        delta: { calories: 120, fat: 3, protein: 22, carbs: 0 },
        quantity: "100g",
        reason: "Lean protein",
      },
    ]
  }, [analysisData])

  // Running totals for macros; start with base macros
  const [totals, setTotals] = useState<Macros>(baseMacros)

  // Update totals when base macros change
  useEffect(() => {
    setTotals(baseMacros)
  }, [baseMacros])

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

  const openAddSheet = useCallback(
    (item: { name: string; img: string; delta: Macros; reason: string; quantity: string }) => {
      setSelected(item)
      setIsAddOpen(true)
    },
    [],
  )

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
      reason: selected.reason,
    }

    // Add to local state
    setAddedItems((prev) => [...prev, newItem])

    // Update local totals for UI
    setTotals((prev) => ({
      calories: prev.calories + selected.delta.calories,
      fat: prev.fat + selected.delta.fat,
      protein: prev.protein + selected.delta.protein,
      carbs: prev.carbs + selected.delta.carbs,
    }))

    closeAddSheet()
  }, [selected, closeAddSheet])

  // Remove item function
  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        if ("vibrate" in navigator) navigator.vibrate?.(5)
      } catch {}

      const itemToRemove = addedItems.find((item) => item.id === itemId)
      if (!itemToRemove) return

      // Remove from local state
      setAddedItems((prev) => prev.filter((item) => item.id !== itemId))

      // Update local totals
      setTotals((prev) => ({
        calories: prev.calories - itemToRemove.macros.calories,
        fat: prev.fat - itemToRemove.macros.fat,
        protein: prev.protein - itemToRemove.macros.protein,
        carbs: prev.carbs - itemToRemove.macros.carbs,
      }))
    },
    [addedItems],
  )

  const { getToken } = useAuth()

  const onTrack = useCallback(async () => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(15)
    } catch {}

    // Get Clerk token
    const token = await getToken()

    // Track the complete meal as a single entry with combined name and totals
    await trackMeal(
      mealName, // Combined meal name
      combinedQuantity, // Combined quantity description
      totals, // Total macros including all added items
      analysisData?.analysisResult,
      analysisData?.photoUrl,
      // Remove the token parameter from here
    )
    const currentDate = new Date().toISOString().split("T")[0]

    // IMPORTANT: Update today's consumed calories by recalculating totals
    await calculateAndSaveDailyCalories(currentDate, token || undefined)

    // Navigate back or to dashboard
    router.push("/home")
  }, [
    mealName,
    combinedQuantity,
    totals,
    trackMeal,
    calculateAndSaveDailyCalories,
    analysisData,
    router,
    food,
    addedItems,
    recommendation,
    getDailySummary,
  ])

  // Show loading state if no analysis data
  if (!analysisData) {
    return (
      <main className="relative min-h-screen bg-gradient-to-br from-background via-card/30 to-background text-foreground flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-heading">Analyzing your food...</h2>
            <p className="text-muted-foreground font-body">This won&apos;t take long</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="relative min-h-screen bg-gradient-to-br from-background via-card/20 to-background text-foreground"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="mx-auto max-w-screen-sm px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
            >
              ← Back
            </button>
            <div className="rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 backdrop-blur px-4 py-2 border border-primary/20 shadow-sm">
              <span className="text-sm font-semibold font-heading bg-secondary-foreground bg-clip-text text-transparent">
                Food Analysis
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-screen-sm px-4 pt-6 pb-24">
        <section aria-label="Food header" className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/80 via-background/50 to-card/30 shadow-xl backdrop-blur-sm">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-gradient-to-tr from-secondary/10 via-primary/5 to-transparent blur-3xl" />

            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold font-heading mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {mealName}
                  </h1>
                  <p className="text-muted-foreground font-body flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Sparkles className="w-3 h-3" />
                      AI Analyzed
                    </span>
                    {combinedQuantity}
                  </p>
                </div>
              </div>

              {analysisData.photoUrl && (
                <div className="relative h-56 w-full rounded-2xl overflow-hidden border border-border/50 shadow-lg mb-4">
                  <Image
                    src={analysisData.photoUrl || "/placeholder.svg"}
                    alt="Captured food photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
              )}
            </div>
          </div>
        </section>

        {addedItems.length > 0 && (
          <section aria-label="Added items" className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold font-heading">Added Items</h3>
            </div>
            <div className="space-y-3">
              {addedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-gradient-to-r from-card/80 to-background/50 shadow-sm backdrop-blur-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-foreground font-heading truncate">{item.name}</div>
                    <div className="text-sm text-muted-foreground font-body">
                      {item.quantity} • +{item.macros.calories} kcal • {item.reason}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-3 p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section aria-label="Macronutrient breakdown" className="mb-8">
          <h3 className="text-lg font-bold font-heading mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Nutrition Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MacroCard label="Calories" value={totals.calories} unit="kcal" tone="primary" />
            <MacroCard label="Fat" value={totals.fat} unit="g" tone="rose" />
            <MacroCard label="Protein" value={totals.protein} unit="g" tone="emerald" />
            <MacroCard label="Carbs" value={totals.carbs} unit="g" tone="sky" />
          </div>
        </section>

        {user?.plan !== "basic" ? (
          <section aria-label="Recommendation" className="mb-8">
            <div
              className={`rounded-3xl border shadow-lg p-6 flex items-start gap-4 backdrop-blur-sm ${
                recommendation === "yes"
                  ? "border-emerald-200/50 bg-gradient-to-br from-emerald-50/80 via-emerald-25/40 to-background/50 dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-background/50"
                  : "border-rose-200/50 bg-gradient-to-br from-rose-50/80 via-rose-25/40 to-background/50 dark:border-rose-900/50 dark:from-rose-950/30 dark:via-rose-950/10 dark:to-background/50"
              }`}
            >
              <div
                className={`p-3 rounded-2xl ${
                  recommendation === "yes" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-rose-100 dark:bg-rose-900/30"
                }`}
              >
                {recommendation === "yes" ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold font-heading mb-2">
                  {recommendation === "yes" ? "✅ Recommended" : "⚠️ Consider Alternatives"}
                </div>
                <p className="text-foreground/80 font-body leading-relaxed">{recommendationText}</p>
                {analysisData?.analysisResult?.data?.suggestion?.recommendedQuantity && (
                  <p className="mt-3 text-sm text-muted-foreground font-body">
                    <strong>Recommended quantity:</strong>{" "}
                    {analysisData.analysisResult.data.suggestion.recommendedQuantity}
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {user?.plan !== "basic" ? (
          <section aria-label="Completeness suggestions" className="mb-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-heading">
                  {recommendation === "yes" ? "Complete Your Meal" : "Healthier Options"}
                </h2>
                <p className="text-sm text-muted-foreground font-body">
                  AI-powered suggestions to optimize your nutrition
                </p>
              </div>
            </div>

            <div className="-mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
                {suggestions.map((s: any, index: any) => (
                  <button
                    key={`${s.name}-${index}`}
                    onClick={() => openAddSheet(s)}
                    className="snap-start w-[140px] shrink-0 rounded-3xl border border-border/50 bg-gradient-to-br from-card/90 via-background/50 to-card/30 backdrop-blur-sm shadow-lg p-4 text-left transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/30 mb-3">
                      <Image
                        src={s.img || "/placeholder.svg"}
                        alt={s.name}
                        fill
                        className="object-cover"
                        unoptimized={s.img?.startsWith("blob:")}
                        sizes="140px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-foreground truncate font-heading mb-1">{s.name}</div>
                      <div className="text-xs text-muted-foreground font-body mb-2">+{s.delta.calories} kcal</div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Plus className="w-3 h-3" />
                        Add
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <div className="h-4" />
        <Button
          className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90 shadow-xl shadow-primary/25 font-semibold text-lg font-body disabled:opacity-50 transition-all duration-200"
          onClick={onTrack}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              Tracking Meal...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5" />
              Track This Meal
            </div>
          )}
        </Button>
      </div>

      <div
        className={`fixed inset-0 z-50 ${isAddOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isAddOpen}
      >
        {/* Scrim */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ease-out ${
            isAddOpen ? "opacity-100" : "opacity-0"
          } bg-black/40 backdrop-blur-sm`}
          onClick={closeAddSheet}
        />
        {/* Sheet */}
        <div
          className={`absolute inset-x-0 bottom-0 transform transition-transform duration-300 ease-out ${
            isAddOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div
            className="mx-auto w-full max-w-screen-sm rounded-t-3xl bg-gradient-to-br from-background/95 via-card/90 to-background/95 backdrop-blur-xl shadow-2xl border-t border-border/50"
            style={{
              height: "50vh",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="relative flex items-center px-6 pt-4 pb-3">
              <div
                className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted-foreground/30"
                aria-hidden="true"
              />
              <h3 className="text-lg font-bold font-heading">Add to Meal</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={closeAddSheet}
                className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="h-[calc(50vh-80px)] overflow-auto px-6 pb-6">
              {selected ? (
                <div className="space-y-6">
                  {/* Selected item */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 bg-card/50">
                    <Image
                      src={selected.img || "/placeholder.svg"}
                      alt={selected.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-xl object-cover border border-border/30 shadow-sm"
                      style={{ objectFit: "cover" }}
                      unoptimized={selected.img?.startsWith("blob:")}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xl font-bold text-foreground font-heading mb-1">{selected.name}</div>
                      <div className="text-sm text-muted-foreground font-body mb-2">{selected.reason}</div>
                      <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                        {selected.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Deltas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <DeltaBadge label="Calories" value={selected.delta.calories} unit="kcal" tone="primary" />
                    <DeltaBadge label="Fat" value={selected.delta.fat} unit="g" tone="rose" />
                    <DeltaBadge label="Protein" value={selected.delta.protein} unit="g" tone="emerald" />
                    <DeltaBadge label="Carbs" value={selected.delta.carbs} unit="g" tone="sky" />
                  </div>

                  {/* Add button */}
                  <Button
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:from-primary/90 hover:to-secondary/90 shadow-lg font-semibold font-body"
                    onClick={onAdd}
                  >
                    <Plus className="w-4 h-4 mr-2" />
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
  tone?: "neutral" | "primary" | "rose" | "emerald" | "sky"
}) {
  const map = {
    neutral: {
      ring: "border-border/50",
      bg: "bg-gradient-to-br from-card/80 to-background/50",
      sub: "text-muted-foreground",
      text: "text-foreground",
      chip: "bg-muted text-muted-foreground",
    },
    primary: {
      ring: "border-primary/20",
      bg: "bg-gradient-to-br from-primary/5 via-secondary/5 to-background/50",
      sub: "text-primary/80",
      text: "text-primary",
      chip: "bg-primary/10 text-primary",
    },
    rose: {
      ring: "border-rose-200/50 dark:border-rose-900/50",
      bg: "bg-gradient-to-br from-rose-50/50 via-rose-25/30 to-background/50 dark:from-rose-950/20 dark:via-rose-950/10 dark:to-background/50",
      sub: "text-rose-700/80 dark:text-rose-300/90",
      text: "text-rose-600 dark:text-rose-400",
      chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    },
    emerald: {
      ring: "border-emerald-200/50 dark:border-emerald-900/50",
      bg: "bg-gradient-to-br from-emerald-50/50 via-emerald-25/30 to-background/50 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-background/50",
      sub: "text-emerald-700/80 dark:text-emerald-300/90",
      text: "text-emerald-600 dark:text-emerald-400",
      chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    sky: {
      ring: "border-sky-200/50 dark:border-sky-900/50",
      bg: "bg-gradient-to-br from-sky-50/50 via-sky-25/30 to-background/50 dark:from-sky-950/20 dark:via-sky-950/10 dark:to-background/50",
      sub: "text-sky-700/80 dark:text-sky-300/90",
      text: "text-sky-600 dark:text-sky-400",
      chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
  }[tone]

  return (
    <div
      className={[
        "rounded-2xl border shadow-lg p-4 backdrop-blur-sm transition-all duration-200 hover:shadow-xl",
        map.ring,
        map.bg,
      ].join(" ")}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={["text-xs font-semibold font-body", map.sub].join(" ")}>{label}</div>
        <div className={["rounded-full px-2.5 py-1 text-xs font-bold", map.chip].join(" ")}>{unit}</div>
      </div>
      <div className={["text-2xl font-bold tabular-nums font-heading", map.text].join(" ")}>{value}</div>
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
  tone?: "neutral" | "primary" | "rose" | "emerald" | "sky"
}) {
  const map = {
    neutral: {
      ring: "border-border/50",
      bg: "bg-gradient-to-br from-card/80 to-background/50",
      sub: "text-muted-foreground",
      text: "text-foreground",
      chip: "bg-muted text-muted-foreground",
    },
    primary: {
      ring: "border-primary/20",
      bg: "bg-gradient-to-br from-primary/5 via-secondary/5 to-background/50",
      sub: "text-primary/80",
      text: "text-primary",
      chip: "bg-primary/10 text-primary",
    },
    rose: {
      ring: "border-rose-200/50 dark:border-rose-900/50",
      bg: "bg-gradient-to-br from-rose-50/50 via-rose-25/30 to-background/50 dark:from-rose-950/20 dark:via-rose-950/10 dark:to-background/50",
      sub: "text-rose-700/80 dark:text-rose-300/90",
      text: "text-rose-600 dark:text-rose-400",
      chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    },
    emerald: {
      ring: "border-emerald-200/50 dark:border-emerald-900/50",
      bg: "bg-gradient-to-br from-emerald-50/50 via-emerald-25/30 to-background/50 dark:from-emerald-950/20 dark:via-emerald-950/10 dark:to-background/50",
      sub: "text-emerald-700/80 dark:text-emerald-300/90",
      text: "text-emerald-600 dark:text-emerald-400",
      chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    sky: {
      ring: "border-sky-200/50 dark:border-sky-900/50",
      bg: "bg-gradient-to-br from-sky-50/50 via-sky-25/30 to-background/50 dark:from-sky-950/20 dark:via-sky-950/10 dark:to-background/50",
      sub: "text-sky-700/80 dark:text-sky-300/90",
      text: "text-sky-600 dark:text-sky-400",
      chip: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
  }[tone]

  return (
    <div className={["rounded-2xl border shadow-lg p-4 backdrop-blur-sm", map.ring, map.bg].join(" ")}>
      <div className="flex items-center justify-between mb-2">
        <div className={["text-xs font-semibold font-body", map.sub].join(" ")}>{label}</div>
        <div className={["rounded-full px-2.5 py-1 text-xs font-bold", map.chip].join(" ")}>{unit}</div>
      </div>
      <div className={["text-xl font-bold tabular-nums font-heading", map.text].join(" ")}>
        {value >= 0 ? "+" : ""}
        {value}
      </div>
    </div>
  )
}
