"use client";
import React, { useCallback, useEffect, useState } from "react";
import RecipeCard from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useDailyMeals } from "@/hooks/use-meals";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAddRecipe, useRecipes, useRemoveRecipe } from "@/store";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function Recipes() {
  const recipes = useRecipes();
  const removeRecipe = useRemoveRecipe();
  const { getToken } = useAuth();
  const { trackMeal: trackMealAsync } = useDailyMeals();
  // keep a local, mutable list so deletes update UI smoothly
  const [data, setData] = React.useState(recipes);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const router = useRouter();
  const isTyping = query !== debouncedQuery;
  const addRecipe = useAddRecipe();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isAddingCustomRecipe, setIsAddingCustomRecipe] = useState(false);
  const [customRecipe, setCustomRecipe] = useState({
    mealName: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  // when the upstream recipes ever changes, sync once (defensive)
  React.useEffect(() => {
    setData(recipes);
  }, [recipes]);

  const filtered = React.useMemo(() => {
    const q = normalize(debouncedQuery);
    if (!q) return data;

    const terms = q.split(/\s+/).filter(Boolean);

    return data.filter((rp) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const names = (rp.foodItems ?? []).map((fi: any) =>
        normalize(fi?.name ?? ""),
      );
      const combined = names.join(" ");

      return (
        combined.includes(q) ||
        terms.every((t) => names.some((n: string) => n.includes(t)))
      );
    });
  }, [data, debouncedQuery]);

  const showReset = query.length > 0;

  // Efficiently remove a recipe and let AnimatePresence handle exit animation
  const handleDelete = React.useCallback(
    async (id: string) => {
      setData((prev) => prev.filter((r) => r.id !== id));
      const token = await getToken();
      if (!token) return;
      removeRecipe(id, token);
    },
    [getToken, removeRecipe],
  );

  const trackMeal = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (rp: any) => {
      const { mealName, combinedQuantity, totalMacros, source } = rp;
      if (!mealName || !totalMacros) return;
      const token = await getToken();
      if (!token) return;
      setAddingId(rp.id);
      try {
        await trackMealAsync(
          mealName,
          combinedQuantity || [],
          totalMacros,
          source || null,
        );
        // Use useEffect for navigation instead of setTimeout
        // Move this to a separate useEffect
        setShouldNavigate(true);
      } finally {
        setAddingId(null);
      }
    },
    [getToken, trackMealAsync],
  );

  useEffect(() => {
    if (shouldNavigate) {
      const timer = setTimeout(() => {
        router.push("/home");
        setShouldNavigate(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, router]);

  const handleCustomRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !customRecipe.mealName ||
      !customRecipe.calories ||
      !customRecipe.protein ||
      !customRecipe.carbs ||
      !customRecipe.fat
    )
      return;

    const totalMacros = {
      calories: Number.parseFloat(customRecipe.calories) || 0,
      protein: Number.parseFloat(customRecipe.protein) || 0,
      carbs: Number.parseFloat(customRecipe.carbs) || 0,
      fat: Number.parseFloat(customRecipe.fat) || 0,
    };

    const recipeData = {
      mealName: customRecipe.mealName,
      qunatitySummary: "1 serving",
      combinedQuantity: [],
      totalMacros,
      foodItems: [],
      suggestion: null,
      source: null,
      createdAt: new Date().toISOString(),
    };

    setIsAddingCustomRecipe(true);
    try {
      const token = await getToken();
      if (!token) return;
      addRecipe(recipeData, token);
      setShowBottomSheet(false);
      setCustomRecipe({
        mealName: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
    } catch {
    } finally {
      setIsAddingCustomRecipe(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCustomRecipe((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <section className="bg-background min-h-screen">
      <div className="sticky top-0 z-10 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <label htmlFor="recipe-search" className="sr-only">
            Search recipes by food items
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="recipe-search"
              type="search"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ingredients (e.g., chicken, rice, avocado)"
              autoComplete="off"
              autoCapitalize="none"
              aria-label="Search recipes by ingredients"
              aria-busy={isTyping}
              className={cn(
                "h-11 w-full rounded-full border border-border bg-muted/60 pl-10 pr-12",
                "text-[16px] leading-6 placeholder:text-muted-foreground",
                "shadow-sm transition focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:border-primary/40",
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBottomSheet(true)}
              className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full p-0 hover:bg-primary/10"
              aria-label="Add custom recipe"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {isTyping ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-12 flex items-center"
              >
                <svg
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
                  />
                </svg>
              </span>
            ) : null}
          </div>

          {showReset ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setQuery("")}
              className="shrink-0"
              aria-label="Clear search"
            >
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-24 pt-4">
        {filtered.length === 0 ? (
          <div className="grid place-items-center rounded-lg p-10 text-center">
            <div className="max-w-md space-y-2">
              <p className="text-balance text-lg font-medium">
                No recipes found
              </p>
              <p className="text-sm text-muted-foreground">
                Try different ingredient keywords or clear the search to see all
                recipes.
              </p>
              <div className="pt-2">
                <Button variant="secondary" onClick={() => setQuery("")}>
                  Reset search
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <motion.div
            layout
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <AnimatePresence initial={false}>
              {filtered.map((rp) => (
                <motion.div
                  key={rp.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <RecipeCard
                    isAdding={addingId === rp.id}
                    onAddItem={() => trackMeal(rp)}
                    onRemoveItem={() => handleDelete(rp.id)}
                    meal={rp}
                    className="border-b"
                    showButtons
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showBottomSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowBottomSheet(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-999950 rounded-t-3xl bg-background border-t shadow-2xl"
            >
              <div className="mx-auto max-w-md p-6">
                {/* Handle bar */}
                <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-muted-foreground/30" />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Add Custom Recipe</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBottomSheet(false)}
                    className="h-8 w-8 rounded-full p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleCustomRecipeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meal-name">Meal Name *</Label>
                    <Input
                      id="meal-name"
                      type="text"
                      value={customRecipe.mealName}
                      onChange={(e) =>
                        handleInputChange("mealName", e.target.value)
                      }
                      placeholder="e.g., Grilled Chicken Salad"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories *</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={customRecipe.calories}
                        onChange={(e) =>
                          handleInputChange("calories", e.target.value)
                        }
                        placeholder="350"
                        required
                        min="0"
                        step="1"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="protein">Protein (g) *</Label>
                      <Input
                        id="protein"
                        type="number"
                        value={customRecipe.protein}
                        onChange={(e) =>
                          handleInputChange("protein", e.target.value)
                        }
                        placeholder="25"
                        required
                        min="0"
                        step="0.1"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="carbs">Carbs (g) *</Label>
                      <Input
                        id="carbs"
                        type="number"
                        value={customRecipe.carbs}
                        onChange={(e) =>
                          handleInputChange("carbs", e.target.value)
                        }
                        placeholder="15"
                        required
                        min="0"
                        step="0.1"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fat">Fat (g) *</Label>
                      <Input
                        id="fat"
                        type="number"
                        value={customRecipe.fat}
                        onChange={(e) =>
                          handleInputChange("fat", e.target.value)
                        }
                        placeholder="12"
                        required
                        min="0"
                        step="0.1"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBottomSheet(false)}
                      className="flex-1 h-11"
                      disabled={isAddingCustomRecipe}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-11"
                      disabled={
                        !customRecipe.mealName ||
                        !customRecipe.calories ||
                        !customRecipe.protein ||
                        !customRecipe.carbs ||
                        !customRecipe.fat ||
                        isAddingCustomRecipe
                      }
                    >
                      {isAddingCustomRecipe ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
                            />
                          </svg>
                          Adding...
                        </div>
                      ) : (
                        "Add Recipe"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
