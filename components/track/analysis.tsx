/** eslint-disable @typescript-eslint/no-explicit-Any */
/** eslint-disable react-hooks/exhaustive-deps */
/** eslint-disable @typescript-eslint/no-explicit-Any */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDailyMeals } from "@/hooks/use-meals";
import { useAuth } from "@clerk/nextjs";
import { Droplet, Drumstick, Flame, Plus, Wheat, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  useAddRecipe,
  useCurrentDayNutrition,
  useNutritionStore,
  useRecipes,
  useRecipeStore,
  useUserStore,
} from "@/store";
import { useFoodAnalysis } from "@/hooks/use-food";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;
type AnalysisProps = {
  uploading: boolean;
  analyzing: boolean;
  extractingState: boolean;
  uploadError?: string | null;
  analysisError?: string | null;
  extractionError?: string | null;
  voiceError?: string | null;
  voiceText: string;
  progress: number;
  isSafari: boolean;
  handleRetry: () => void;
  closeCard: () => void;
  openManualCard: () => void;
  currentFood?: { name: string; quantity: string };
  hasEditedQuantity: boolean;
  isEditingQuantity: boolean;
  handleEditQuantity: () => void;
  editedQuantity: string;
  setEditedQuantity: (v: string) => void;
  isUpdatingMacros: boolean;
  handleUpdateMacros: () => void;
  handleCancelEdit: () => void;
  onClose: () => void;
  tracking: boolean;
  analysisData: Any;
  onMealDraftChange?: (draft: {
    mealName: string;
    combinedQuantity: string;
    totalMacros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    foodItems: { name: string; quantity: string }[];
  }) => void;
  onRecalculateMeal?: (items: { name: string; quantity: string }[]) => Promise<{
    totalMacros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    suggestion?: Any;
  } | null>;
};
export function Analysis(props: AnalysisProps) {
  const {
    uploading,
    analyzing,
    extractingState,
    uploadError,
    analysisError,
    extractionError,
    voiceError,
    voiceText,
    progress,
    isSafari,
    handleRetry,
    closeCard,
    openManualCard,
    onClose,
    tracking,
    analysisData,
  } = props;
  const [, setAddedItems] = useState<number[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemQty, setItemQty] = useState<Record<string, string>>({});
  const [suggestQty, setSuggestQty] = useState<Record<string, string>>({});
  const [updatingName, setUpdatingName] = useState<string | null>(null);
  const [isTrackingLocal, setIsTrackingLocal] = useState(false);
  const [isEditingTotals, setIsEditingTotals] = useState(false);
  const [recipeAdded, setRecipeAdded] = useState(false);
  const [totalsDraft, setTotalsDraft] = useState<{
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  } | null>(null);
  const { getToken } = useAuth();
  const { calculateAndSaveDailyCalories } = useNutritionStore();
  const { syncRecipes } = useRecipeStore();
  const { trackMeal } = useDailyMeals();
  const addRecipe = useAddRecipe();
  const router = useRouter();
  const [overrideTotals, setOverrideTotals] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [overrideSuggestion, setOverrideSuggestion] = useState<Any>(null);
  const [isSavingRecipe, setIsSavingRecipe] = useState(false); // add loading state for saving a recipe
  const baseItems = useMemo(() => {
    const items = props?.analysisData?.data?.foodItems ?? [];
    return Array.isArray(items) ? items : [];
  }, [props?.analysisData]);
  const mealSuggestionItems = useMemo(() => {
    return (
      props?.analysisData?.data?.suggestion?.mealCompletionSuggestions ?? []
    );
  }, [props?.analysisData?.data?.suggestion?.mealCompletionSuggestions]);
  const selectedSuggestionDetails = useMemo(() => {
    if (!selectedItems?.length) return [];
    const map = new Map<string, Any>();
    mealSuggestionItems.forEach((it: Any) => map.set(it.name, it));
    const details = selectedItems.map((name) => {
      const raw = map.get(name);
      if (!raw) return null;
      return {
        ...raw,
        quantity: suggestQty[name] || raw.quantity || "1 serving",
      };
    });
    return details.filter(Boolean);
  }, [selectedItems, mealSuggestionItems, suggestQty]);
  const smartMealName = useMemo(() => {
    const names: string[] = [];
    baseItems.forEach((it: Any) => names.push(it?.name ?? "Item"));
    selectedSuggestionDetails.forEach((it: Any) =>
      names.push(it?.name ?? "Item"),
    );
    return names.length ? names.join(", ") : props.currentFood?.name || "Meal";
  }, [baseItems, selectedSuggestionDetails, props.currentFood?.name]);
  const quantitySummary = useMemo(() => {
    const parts: string[] = [];
    baseItems.forEach((it: Any) => {
      if (!it) return;
      const nm = it.name || "Item";
      const edited = itemQty[nm];
      const qty = edited || it.quantity || "1 serving";
      parts.push(`${qty} of ${nm}`);
    });
    selectedSuggestionDetails.forEach((it: Any) => {
      if (!it) return;
      const nm = it.name || "Item";
      const qty = it.quantity || "1 serving";
      parts.push(`${qty} of ${nm}`);
    });
    return parts.join(", ");
  }, [baseItems, selectedSuggestionDetails, itemQty]);
  const displaySuggestion =
    overrideSuggestion ?? props?.analysisData?.data?.suggestion;
  const combinedTotals = useMemo(() => {
    const base = overrideTotals ??
      props?.analysisData?.data?.totalMacros ?? {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    if (overrideTotals) return overrideTotals;
    const add = selectedSuggestionDetails.reduce(
      (acc: Any, it: Any) => {
        const m = it?.macros ?? {};
        acc.calories += Number(m.calories ?? 0);
        acc.protein += Number(m.protein ?? 0);
        acc.carbs += Number(m.carbs ?? 0);
        acc.fat += Number(m.fat ?? 0);
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
    return {
      calories: Number(base.calories ?? 0) + add.calories || 0,
      protein: Number(base.protein ?? 0) + add.protein || 0,
      carbs: Number(base.carbs ?? 0) + add.carbs || 0,
      fat: Number(base.fat ?? 0) + add.fat || 0,
    };
  }, [
    props?.analysisData?.data?.totalMacros,
    selectedSuggestionDetails,
    overrideTotals,
  ]);
  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );
  };
  const applyItemQuantity = async (name: string) => {
    if (!props.onRecalculateMeal) return;
    const updatedItems = [
      ...baseItems.map((it: Any) => ({
        name: it?.name ?? "Item",
        quantity: itemQty[it?.name] || it?.quantity || "1 serving",
      })),
      ...selectedSuggestionDetails.map((it: Any) => ({
        name: it?.name ?? "Item",
        quantity: it?.quantity || "1 serving",
      })),
    ];
    try {
      setUpdatingName(name);
      const res = await props.onRecalculateMeal(updatedItems);
      if (res?.totalMacros) setOverrideTotals(res.totalMacros);
      if (res?.suggestion) setOverrideSuggestion(res.suggestion);
    } finally {
      setUpdatingName(null);
    }
  };
  const applySuggestionQuantity = async (name: string) => {
    if (!props.onRecalculateMeal) return;
    const updatedItems = [
      ...baseItems.map((it: Any) => ({
        name: it?.name ?? "Item",
        quantity: itemQty[it?.name] || it?.quantity || "1 serving",
      })),
      ...selectedSuggestionDetails.map((it: Any) => ({
        name: it?.name ?? "Item",
        quantity: suggestQty[it?.name] || it?.quantity || "1 serving",
      })),
    ];
    try {
      setUpdatingName(name);
      const res = await props.onRecalculateMeal(updatedItems);
      if (res?.totalMacros) setOverrideTotals(res.totalMacros);
      if (res?.suggestion) setOverrideSuggestion(res.suggestion);
    } finally {
      setUpdatingName(null);
    }
  };
  useEffect(() => {
    if (typeof props.handleUpdateMacros === "function") {
      // @ts-expect-error allow passing totals
      props.handleUpdateMacros(combinedTotals);
    }
    if (typeof props.onMealDraftChange === "function") {
      const items = [
        ...baseItems.map((it: Any) => ({
          name: it?.name ?? "Item",
          quantity: itemQty[it?.name] || it?.quantity || "1 serving",
        })),
        ...selectedSuggestionDetails.map((it: Any) => ({
          name: it?.name ?? "Item",
          quantity: it?.quantity || "1 serving",
        })),
      ];
      props.onMealDraftChange({
        mealName: smartMealName,
        combinedQuantity: quantitySummary,
        totalMacros: combinedTotals,
        foodItems: items,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    smartMealName,
    quantitySummary,
    JSON.stringify(combinedTotals),
    JSON.stringify(baseItems),
    JSON.stringify(selectedSuggestionDetails),
    JSON.stringify(itemQty),
  ]);
  const handleAddMeal = async () => {
    if (!analysisData?.data) return;
    try {
      setIsTrackingLocal(true); // block UI locally regardless of parent prop
      const mealName = smartMealName;
      const combinedQuantity = quantitySummary;
      const token = await getToken();
      if (!token) return;
      await trackMeal(mealName, combinedQuantity, combinedTotals, analysisData);
      const currentDate = new Date().toISOString().split("T")[0];
      await calculateAndSaveDailyCalories(currentDate, token);
      clearAllStates();
      router.push("/home");
    } catch (error) {
    } finally {
      setIsTrackingLocal(false);
    }
  };
  const handleAddRecipe = async () => {
    // create handleAddRecipe to compile final data and call addRecipe
    try {
      setIsSavingRecipe(true);

      // Build final base items with applied quantity edits
      const finalBaseItems = baseItems.map((it: Any) => {
        const name = it?.name ?? "Item";
        return {
          name,
          quantity: itemQty[name] || it?.quantity || "1 serving",
          macros: it?.macros ?? null,
          imageUrl: it?.imageUrl ?? null,
        };
      });

      // Build final selected suggestion items with applied quantity edits
      const finalSuggestionItems = selectedSuggestionDetails.map((it: Any) => {
        const name = it?.name ?? "Item";
        return {
          name,
          quantity: suggestQty[name] || it?.quantity || "1 serving",
          macros: it?.macros ?? null,
          imageUrl: it?.imageUrl ?? null,
        };
      });

      const recipeData = {
        mealName: smartMealName,
        combinedQuantity: quantitySummary,
        totalMacros: combinedTotals,
        foodItems: [...finalBaseItems, ...finalSuggestionItems],
        suggestion: displaySuggestion ?? null,
        source: analysisData ?? null,
        createdAt: new Date().toISOString(),
      };

      const token = await getToken();
      if (!token) return;
      addRecipe(recipeData);
      await syncRecipes(token);
      clearAllStates();
    } catch (error) {
    } finally {
      setIsSavingRecipe(false);
    }
    setRecipeAdded(true);
  };
  const clearAllStates = () => {
    setAddedItems([]);
    setSelectedItems([]);
    setItemQty({});
    setSuggestQty({});
    setUpdatingName(null);
    setOverrideTotals(null);
    setOverrideSuggestion(null);
    setIsTrackingLocal(false);
    setIsEditingTotals(false);
    setTotalsDraft(null);
  };
  if (uploading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <LoadingState
          type="upload"
          progress={progress}
          message="Uploading your photo..."
        />
      </div>
    );
  }
  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <LoadingState type="analyze" message="Analyzing nutrition..." />
      </div>
    );
  }
  if (extractingState) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <LoadingState
          type="voice"
          message={
            voiceText
              ? "Processing voice input and scanning food..."
              : "Processing voice input..."
          }
        />
      </div>
    );
  }
  if (uploadError || analysisError || extractionError || voiceError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="space-y-8 w-full">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
              <div className="w-8 h-8 bg-destructive rounded-full" />
            </div>
            <h3 className="text-xl font-semibold text-destructive mb-3">
              {uploadError
                ? "Upload Failed"
                : analysisError
                  ? "Analysis Failed"
                  : extractionError || voiceError
                    ? "Voice Processing Failed"
                    : isSafari
                      ? "Safari Not Supported"
                      : "Voice Recognition Failed"}
            </h3>
            <p className="text-base text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
              {uploadError
                ? "We couldn't upload your image. Please check your connection and try again."
                : analysisError
                  ? "We couldn't analyze your food. Please try taking another photo or enter the details manually."
                  : extractionError || voiceError
                    ? "We couldn't process your voice input. Please try speaking again or enter the details manually."
                    : isSafari
                      ? "Voice recognition is not supported in Safari. Please use the camera to take a photo instead."
                      : "Something went wrong. Please try again."}
            </p>
          </div>
          <div className="space-y-4">
            <Button
              onClick={handleRetry}
              className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
              disabled={uploading || analyzing || extractingState}
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                closeCard();
                openManualCard();
              }}
              className="w-full h-12 border border-border hover:bg-muted"
            >
              Enter Manually Instead
            </Button>
          </div>
        </div>
      </div>
    );
  }
  if (!analysisData || !analysisData.success) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No analysis data available.
      </div>
    );
  }
  const { foodItems, suggestion } = analysisData.data;
  return (
    <div
      className="w-full max-w-md mx-auto"
      aria-busy={tracking || isTrackingLocal || isSavingRecipe} // include isSavingRecipe in aria-busy
      aria-live="polite"
    >
      {/* Food header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-balance truncate">
            {smartMealName}
          </h1>
          {quantitySummary ? (
            <h2 className="text-sm text-muted-foreground mt-1 text-pretty">
              {quantitySummary}
            </h2>
          ) : null}
        </div>
      </div>
      {/* Totals header + Edit Totals popover controls */}
      <div className="flex items-center justify-between mt-4">
        <h2 className="font-semibold text-lg">Totals</h2>
        <Popover
          open={isEditingTotals}
          onOpenChange={(open) => {
            setIsEditingTotals(open);
            if (open) {
              setTotalsDraft({
                calories: String(Math.round(combinedTotals.calories || 0)),
                protein: String(Math.round(combinedTotals.protein || 0)),
                carbs: String(Math.round(combinedTotals.carbs || 0)),
                fat: String(Math.round(combinedTotals.fat || 0)),
              });
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 bg-transparent">
              Edit Totals
            </Button>
          </PopoverTrigger>
          <PopoverContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="w-80 p-4 rounded-xl shadow-lg bg-white text-gray-900 border border-gray-200 dark:bg-white dark:text-gray-900 dark:border-gray-200"
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold">Adjust total macros</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">
                    Calories
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={totalsDraft?.calories ?? ""}
                    onChange={(e) =>
                      setTotalsDraft((prev) => ({
                        ...(prev || {
                          calories: "",
                          protein: "",
                          carbs: "",
                          fat: "",
                        }),
                        calories: e.target.value,
                      }))
                    }
                    className="h-9"
                    placeholder="e.g., 520"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={totalsDraft?.protein ?? ""}
                    onChange={(e) =>
                      setTotalsDraft((prev) => ({
                        ...(prev || {
                          calories: "",
                          protein: "",
                          carbs: "",
                          fat: "",
                        }),
                        protein: e.target.value,
                      }))
                    }
                    className="h-9"
                    placeholder="e.g., 28"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Carbs (g)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={totalsDraft?.carbs ?? ""}
                    onChange={(e) =>
                      setTotalsDraft((prev) => ({
                        ...(prev || {
                          calories: "",
                          protein: "",
                          carbs: "",
                          fat: "",
                        }),
                        carbs: e.target.value,
                      }))
                    }
                    className="h-9"
                    placeholder="e.g., 60"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    Fat (g)
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={totalsDraft?.fat ?? ""}
                    onChange={(e) =>
                      setTotalsDraft((prev) => ({
                        ...(prev || {
                          calories: "",
                          protein: "",
                          carbs: "",
                          fat: "",
                        }),
                        fat: e.target.value,
                      }))
                    }
                    className="h-9"
                    placeholder="e.g., 18"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 bg-background text-primary"
                  onClick={() => {
                    const next = {
                      calories: Number(totalsDraft?.calories ?? 0) || 0,
                      protein: Number(totalsDraft?.protein ?? 0) || 0,
                      carbs: Number(totalsDraft?.carbs ?? 0) || 0,
                      fat: Number(totalsDraft?.fat ?? 0) || 0,
                    };
                    setOverrideTotals(next);
                    // @ts-expect-error allow passing totals payload
                    props.handleUpdateMacros?.(next);
                    setIsEditingTotals(false);
                  }}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditingTotals(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                These manual totals override the calculated values.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-nowrap justify-between items-stretch w-full mt-4 space-x-2">
        <StatCard
          icon={Flame}
          value={Math.round(combinedTotals.calories || 0)}
          label="Cal"
          aria-label={`Calories: ${Math.round(combinedTotals.calories || 0)}`}
        />
        <StatCard
          icon={Wheat}
          value={Math.round(combinedTotals.carbs || 0)}
          label="Carbs"
          aria-label={`Carbs: ${Math.round(combinedTotals.carbs || 0)}`}
        />
        <StatCard
          icon={Drumstick}
          value={Math.round(combinedTotals.protein || 0)}
          label="Pro"
          aria-label={`Protein: ${Math.round(combinedTotals.protein || 0)}`}
        />
        <StatCard
          icon={Droplet}
          value={Math.round(combinedTotals.fat || 0)}
          label="Fat"
          aria-label={`Fat: ${Math.round(combinedTotals.fat || 0)}`}
        />
      </div>
      <div className="mt-5">
        <h2 className="font-semibold text-lg">Items</h2>
        <ul className="mt-2 space-y-2">
          {baseItems.map((it: Any) => {
            const name = it?.name ?? "Item";
            const qty = itemQty[name] ?? it?.quantity ?? "1 serving";
            const cal = it?.macros.calories;
            const isLoading = updatingName === name;
            return (
              <li
                key={name}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {qty} ~ {cal}kcal
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      className="h-9 px-3"
                      aria-label={`Edit quantity for ${name}`}
                    >
                      Edit
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="w-80 p-4 rounded-xl shadow-lg bg-white border border-gray-200 dark:bg-white dark:text-gray-900 dark:border-gray-200 text-background"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-background">
                          {name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={itemQty[name] ?? it?.quantity ?? ""}
                          onChange={(e) =>
                            setItemQty((prev) => ({
                              ...prev,
                              [name]: e.target.value,
                            }))
                          }
                          placeholder="e.g., 150 g, 2 slices"
                          className="h-9 text-sm"
                        />
                        <Button
                          onClick={() => applyItemQuantity(name)}
                          disabled={isLoading}
                          size="sm"
                          className="bg-background text-foreground"
                        >
                          {isLoading ? "Updating..." : "Update"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Updating will refresh macros and suggestions for the
                        meal.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-4">
        <h2 className="font-semibold text-lg">Suggestions</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {displaySuggestion?.reason}{" "}
          <span
            className={`font-semibold ${displaySuggestion?.shouldEat ? "" : "text-red-600"}`}
          >
            {displaySuggestion?.shouldEat
              ? `The recommended quantity is ${displaySuggestion?.recommendedQuantity}.`
              : `You are not advised to eat this meal.`}
          </span>
        </p>
      </div>
      {/* Suggestions */}
      {displaySuggestion?.shouldEat && (
        <div className="w-full overflow-x-auto mt-4">
          <h2 className="font-semibold mb-2">Add to meal</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {mealSuggestionItems?.map((item: Any, idx: number) => {
              const isSelected = selectedItems.includes(item.name);
              const name = item.name;
              const localQty = suggestQty[name] ?? item.quantity ?? "1 serving";
              const isLoading = updatingName === name;
              return (
                <Card
                  key={idx}
                  className="min-w-[180px] max-w-[180px] flex-shrink-0 rounded-2xl shadow-sm"
                >
                  <CardContent className="px-4 flex flex-col">
                    {/* Food Image */}
                    <div className="relative w-24 h-24 mb-3 rounded-full overflow-hidden self-center">
                      <Image
                        src={item.imageUrl || "/food.png"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {/* Food Text */}
                    <div className="my-3">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {localQty}
                      </p>
                    </div>
                    {/* Action Button with Popover */}
                    <div className="flex justify-end w-full">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon"
                            className={`h-8 w-8 rounded-full ${
                              isSelected
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : ""
                            }`}
                            variant={isSelected ? "destructive" : "default"}
                          >
                            {isSelected ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          onOpenAutoFocus={(e) => e.preventDefault()}
                          className="w-80 p-4 rounded-xl shadow-lg bg-white text-gray-900 border border-gray-200 dark:bg-white dark:text-gray-900 dark:border-gray-200"
                        >
                          {/* Popover Header with Image */}
                          <div className="flex gap-3">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden">
                              <Image
                                src="/food.png"
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <h3 className="text-lg text-background font-semibold">
                                {item.name}
                              </h3>
                              <p className="text-sm text-muted-background">
                                {localQty}
                              </p>
                            </div>
                          </div>
                          {/* Macros */}
                          <div className="flex gap-4 mt-4 text-sm text-background">
                            <div className="flex items-center gap-1">
                              <Flame className="h-4 w-4 text-orange-500" />
                              {item.macros?.calories ?? 0} kcal
                            </div>
                            <div className="flex items-center gap-1">
                              <Drumstick className="h-4 w-4 text-red-500" />
                              {item.macros?.protein ?? 0} g
                            </div>
                            <div className="flex items-center gap-1">
                              <Wheat className="h-4 w-4 text-muted-foreground" />
                              {item.macros?.carbs ?? 0} g
                            </div>
                            <div className="flex items-center gap-1">
                              <Droplet className="h-4 w-4 text-red-800" />
                              {item.macros?.fat ?? 0} g
                            </div>
                          </div>
                          {/* Reason */}
                          <p className="mt-3 text-sm text-muted-foreground leading-snug">
                            {item.reason ||
                              "This item complements your meal with balanced nutrition."}
                          </p>
                          {/* Add/Remove Button */}
                          <Button
                            onClick={() => toggleItem(item.name)}
                            className="mt-4 w-full bg-background text-primary"
                            variant={isSelected ? "destructive" : "default"}
                          >
                            {isSelected ? "Remove from Meal" : "Add to Meal"}
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      {!displaySuggestion?.shouldEat && (
        <div className="mt-4">
          <h2 className="font-semibold text-lg mb-3">Instead Try</h2>
          <div
            className="
            flex gap-3 overflow-x-auto scrollbar-none
            snap-x snap-mandatory scroll-smooth
            -mx-2 px-2
          "
          >
            {displaySuggestion?.alternatives.map((item: Any) => (
              <div
                key={item}
                className="
                bg-card rounded-2xl px-4 py-2
                flex-shrink-0 snap-start
                text-sm font-medium shadow-sm
                hover:shadow-md hover:bg-accent hover:text-accent-foreground
                transition-all duration-200
                cursor-pointer
              "
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
        <div className="mx-auto max-w-md px-8 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              onClick={() => {
                if (recipeAdded) return;
                handleAddRecipe();
              }}
              variant="outline"
              className="w-1/2 h-11 bg-transparent"
              disabled={tracking || isTrackingLocal || isSavingRecipe}
            >
              {isSavingRecipe
                ? "Saving..."
                : !recipeAdded
                  ? "Add to recipes"
                  : "Added to recipes"}
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleAddMeal();
              }}
              className="w-1/2 h-11"
              disabled={tracking || isTrackingLocal || isSavingRecipe}
            >
              {tracking || isTrackingLocal ? "Adding..." : "Add Meal"}
            </Button>
          </div>
          <div className="pt-[env(safe-area-inset-bottom)]" />
        </div>
      </div>
      {(tracking || isTrackingLocal || isSavingRecipe) && ( // show loading overlay for both meal add and recipe save
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm pointer-events-auto flex items-center justify-center">
          <LoadingState
            type="analyze"
            message={
              isSavingRecipe ? "Saving your recipe..." : "Adding your meal..."
            }
          />
        </div>
      )}
    </div>
  );
}
function LoadingState({
  type,
  message,
  progress,
}: {
  type: "upload" | "analyze" | "voice";
  message?: string;
  progress?: number;
}) {
  const label =
    type === "upload"
      ? "Uploading"
      : type === "analyze"
        ? "Analyzing"
        : "Processing";
  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
      <p className="text-base font-medium">{message || `${label}...`}</p>
      {typeof progress === "number" && type === "upload" ? (
        <div className="mt-3">
          <div className="h-2 w-full bg-muted rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {Math.round(progress)}%
          </p>
        </div>
      ) : null}
    </div>
  );
}
const StatCard = ({
  icon: Icon,
  value,
  label,
  ariaLabel,
}: {
  icon: Any;
  value: string | number;
  label: string;
  ariaLabel?: string;
}) => (
  <div
    className="flex flex-1 min-w-0 flex-col items-center justify-center rounded-full bg-card text-primary p-4 w-20 h-28 shadow-md"
    aria-label={ariaLabel}
  >
    <Icon className="h-6 w-6 mb-1" />
    <span className="font-bold">{value}</span>
    <span className="text-xs">{label}</span>
  </div>
);

interface AnalysisWrapperProps {
  // Analysis display props
  uploading?: boolean;
  analyzing?: boolean;
  extractingState?: boolean;
  uploadError?: string | null;
  analysisError?: string | null;
  extractionError?: string | null;
  voiceError?: string | null;
  voiceText?: string;
  progress?: number;
  isSafari?: boolean;

  // Analysis data
  analysisResult?: Any;

  // UI state
  isOpen: boolean;
  onClose: () => void;

  // Optional handlers
  handleRetry: () => void;
  openManualCard: () => void;

  // Photo data (for camera scans)
  photoUrl?: string;

  // Navigation options
  redirectAfterAdd?: string; // Where to go after adding meal
  showEditButton?: boolean; // Whether to show edit button for image analysis
}

export function AnalysisWrapper({
  uploading = false,
  analyzing = false,
  extractingState = false,
  uploadError = null,
  analysisError = null,
  extractionError = null,
  voiceError = null,
  voiceText = "",
  progress = 0,
  isSafari = false,
  analysisResult,
  isOpen,
  onClose,
  handleRetry,
  openManualCard,
  photoUrl,
  redirectAfterAdd = "/home",
  showEditButton = true,
}: AnalysisWrapperProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { trackMeal } = useDailyMeals();
  const { analyzeText } = useFoodAnalysis();
  const { calculateAndSaveDailyCalories } = useNutritionStore();
  const currentDayNutrition = useCurrentDayNutrition();

  // Local state for quantity editing
  const [isEditingQuantity, setIsEditingQuantity] = useState(false);
  const [editedQuantity, setEditedQuantity] = useState("");
  const [hasEditedQuantity, setHasEditedQuantity] = useState(false);
  const [updatedMacros, setUpdatedMacros] = useState<Any>(null);
  const [isUpdatingMacros, setIsUpdatingMacros] = useState(false);
  const [tracking, setTracking] = useState(false);

  // Derived data
  const defaultFood = { name: "Avocado Toast", quantity: "1 slice" };
  const currentFood = analysisResult?.data?.foodItems?.[0] || defaultFood;

  const clearAllStates = useCallback(() => {
    setIsEditingQuantity(false);
    setEditedQuantity("");
    setHasEditedQuantity(false);
    setUpdatedMacros(null);
    setIsUpdatingMacros(false);
    setTracking(false);
  }, []);

  const handleEditQuantity = useCallback(() => {
    if (hasEditedQuantity) return; // Only allow editing once

    const currentFood = analysisResult?.data?.foodItems?.[0];
    if (currentFood) {
      setEditedQuantity(currentFood.quantity);
      setIsEditingQuantity(true);
    }
  }, [analysisResult, hasEditedQuantity]);

  const handleUpdateMacros = useCallback(async () => {
    if (!editedQuantity.trim() || !analysisResult?.data?.foodItems?.[0]) return;

    const currentFood = analysisResult.data.foodItems[0];
    setIsUpdatingMacros(true);

    try {
      // Make API call similar to text analysis but for quantity update
      const result = await analyzeText(
        currentFood.name,
        editedQuantity.trim(),
        undefined, // userContext would need to be passed as prop if needed
      );

      if (result?.success && result?.data) {
        setUpdatedMacros(result.data.totalMacros);
        setHasEditedQuantity(true);
        setIsEditingQuantity(false);

        // Update the analysis result with new quantity and macros
        const updatedResult = {
          ...analysisResult,
          data: {
            ...analysisResult.data,
            foodItems: [
              {
                ...currentFood,
                quantity: editedQuantity.trim(),
              },
            ],
            totalMacros: result.data.totalMacros,
          },
        };

        // Store updated result for tracking
        sessionStorage.setItem(
          "foodAnalysisData",
          JSON.stringify({
            analysisResult: updatedResult,
            photoUrl,
            analysisType: "image_with_quantity_edit",
          }),
        );
      }
    } catch (error) {
      console.error("Error updating macros:", error);
    } finally {
      setIsUpdatingMacros(false);
    }
  }, [editedQuantity, analysisResult, photoUrl, analyzeText]);

  const handleCancelEdit = useCallback(() => {
    setIsEditingQuantity(false);
    setEditedQuantity("");
  }, []);

  const handleAddMeal = useCallback(async () => {
    if (!analysisResult?.data || !currentDayNutrition) return;

    setTracking(true);
    try {
      // Create combined meal name from all items
      const mealName = analysisResult.data.foodItems
        .map((item: Any) => item.name)
        .join(", ");

      // Create combined quantity description
      const combinedQuantity = analysisResult.data.foodItems
        .map((item: Any) => `${item.quantity} of ${item.name}`)
        .join(", ");

      const token = await getToken();
      if (!token) return;

      // Use updated macros if quantity was edited
      const finalMacros = updatedMacros || analysisResult.data.totalMacros;

      // Track the meal using store logic
      await trackMeal(
        mealName,
        combinedQuantity,
        finalMacros,
        analysisResult,
        photoUrl,
      );

      const currentDate = new Date().toISOString().split("T")[0];

      // Update today's consumed calories by recalculating totals
      await calculateAndSaveDailyCalories(currentDate, token);

      clearAllStates();
      onClose();

      // Navigate to specified redirect location
      router.push(redirectAfterAdd);
    } catch (error) {
      console.error("Error adding meal:", error);
    } finally {
      setTracking(false);
    }
  }, [
    analysisResult,
    currentDayNutrition,
    updatedMacros,
    photoUrl,
    getToken,
    trackMeal,
    calculateAndSaveDailyCalories,
    clearAllStates,
    onClose,
    router,
    redirectAfterAdd,
  ]);

  const handleRecalculateMeal = useCallback(
    async (items: { name: string; quantity: string }[]) => {
      try {
        // Build a combined quantity summary for the analyzer
        const combinedQuantity = items
          .map((i) => `${i.quantity} of ${i.name}`)
          .join(", ");
        const res = await analyzeText("Meal", combinedQuantity, undefined);
        if (res?.success && res?.data) {
          return {
            totalMacros: res.data.totalMacros,
            suggestion: res.data.suggestion,
          };
        }
      } catch (e) {
        console.error("Error recalculating meal:", e);
      }
      return null;
    },
    [analyzeText],
  );

  const handleClose = useCallback(() => {
    clearAllStates();
    onClose();
  }, [clearAllStates, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-30 transition-opacity duration-300 ease-out opacity-100 pointer-events-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="h-full w-full bg-background/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="relative flex justify-end items-end px-6 pt-6 pb-0 space-x-0">
          {showEditButton &&
            analysisResult?.analysisType === "image" &&
            openManualCard && (
              <button
                type="button"
                aria-label="Edit"
                onClick={() => {
                  handleClose();
                  openManualCard();
                }}
                className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-8 h-[calc(100vh-64px)] overflow-y-auto">
          <Analysis
            uploading={uploading}
            analyzing={analyzing}
            extractingState={extractingState}
            uploadError={uploadError}
            onClose={handleClose}
            analysisError={analysisError}
            extractionError={extractionError}
            voiceError={voiceError}
            voiceText={voiceText}
            progress={progress}
            isSafari={isSafari}
            handleRetry={handleRetry as Any}
            analysisData={analysisResult}
            closeCard={handleClose}
            openManualCard={openManualCard as Any}
            currentFood={currentFood}
            hasEditedQuantity={hasEditedQuantity}
            isEditingQuantity={isEditingQuantity}
            handleEditQuantity={handleEditQuantity}
            editedQuantity={editedQuantity}
            setEditedQuantity={setEditedQuantity}
            isUpdatingMacros={isUpdatingMacros}
            handleUpdateMacros={handleUpdateMacros}
            handleCancelEdit={handleCancelEdit}
            tracking={tracking}
            onRecalculateMeal={handleRecalculateMeal}
            onMealDraftChange={undefined}
          />
        </div>
      </div>
    </div>
  );
}
