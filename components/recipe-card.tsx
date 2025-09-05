"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Plus, Trash2, Drumstick, Wheat, Droplet, Loader2 } from "lucide-react";
import { useState } from "react";

type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type FoodItem = {
  name: string;
  macros: MacroTotals;
  quantity?: string | null;
  imageUrl?: string | null;
};

type Meal = {
  mealName: string;
  combinedQuantity?: string;
  totalMacros: MacroTotals;
  foodItems: FoodItem[];
};

interface MealCardProps {
  meal: Meal;
  className?: string;
  onAddItem?: () => void;
  onRemoveItem?: () => void;
  isAdding?: boolean;
  showButtons: boolean;
}

/**
 * MealCard
 * - Click meal name to open a popover listing food item names
 * - Combined quantity below meal name
 * - Large, bold total calories
 * - Horizontal row of macros (Protein • Carbs • Fat)
 * - Add/Remove icon buttons with tooltips
 */
export default function RecipeCard({
  meal,
  className,
  onAddItem,
  isAdding,
  onRemoveItem,
  showButtons,
}: MealCardProps) {
  const itemNames = (meal.foodItems ?? []).map((f) => f.name).filter(Boolean);
  const hasItems = itemNames.length > 0;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isAddButtonLoading, setIsAddButtonLoading] = useState(false);
  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-5 md:p-6 min-h-48 max-h-48 h-48",
        className,
      )}
      aria-label={`Meal card for ${meal.mealName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="text-left text-pretty font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
                  aria-haspopup="dialog"
                  aria-label={`View foods in ${meal.mealName}`}
                  disabled={!!isAdding}
                  aria-disabled={!!isAdding}
                >
                  <h3 className="text-lg md:text-xl">
                    {meal.mealName.slice(0, 25)}{" "}
                    {meal.mealName.length > 25 ? "..." : ""}
                  </h3>
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-64 p-3"
                side="bottom"
                align="start"
                aria-label={`Foods in ${meal.mealName}`}
              >
                <p className="text-sm font-medium mb-2">Foods</p>
                {hasItems ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {itemNames.map((name, idx) => (
                      <li
                        key={`${name}-${idx}`}
                        className="text-sm text-foreground"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No items yet.</p>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {meal.combinedQuantity ? (
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              {meal.combinedQuantity}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {showButtons && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-9 w-9"
                    aria-label="Add food item"
                    onClick={() => {
                      setIsAddButtonLoading((prev) => !prev);
                      if (onAddItem) {
                        onAddItem();
                      }
                      setTimeout(() => {
                        setIsAddButtonLoading(false);
                      }, 5000);
                    }}
                    disabled={!!isAddButtonLoading}
                    aria-disabled={!!isAddButtonLoading}
                    aria-busy={!!isAddButtonLoading}
                  >
                    {isAddButtonLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                )}
              </TooltipTrigger>
              <TooltipContent side="left">Add food</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover
                  open={confirmOpen}
                  onOpenChange={(open) => {
                    if (!isAdding) setConfirmOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    {showButtons && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 bg-transparent"
                        aria-label="Remove food item"
                        onClick={() => {
                          if (!isAddButtonLoading) setConfirmOpen(true);
                        }}
                        disabled={!!isAddButtonLoading}
                        aria-disabled={!!isAddButtonLoading}
                      >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                      </Button>
                    )}
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-40 p-3"
                    side="left"
                    align="center"
                  >
                    <p className="text-sm font-medium mb-2">
                      Delete this meal?
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmOpen(false)}
                        disabled={!!isAdding}
                        aria-disabled={!!isAdding}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setConfirmOpen(false);
                          onRemoveItem?.();
                        }}
                        disabled={!!isAdding}
                        aria-disabled={!!isAdding}
                      >
                        Delete
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="left">Remove food</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Total Calories - prominent */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {Math.round(meal.totalMacros.calories)}
          </span>
          <span className="text-muted-foreground font-medium">kcal</span>
        </div>

        {/* Macros Row */}
        <MacrosRow
          protein={meal.totalMacros.protein}
          carbs={meal.totalMacros.carbs}
          fat={meal.totalMacros.fat}
        />
      </div>
    </div>
  );
}

function MacrosRow({
  protein,
  carbs,
  fat,
}: {
  protein: number;
  carbs: number;
  fat: number;
}) {
  const fmt = (v: number) =>
    Number.isInteger(v) ? v.toFixed(0) : v.toFixed(1);

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 text-sm">
      {/* Protein */}
      <div className="flex items-center justify-center gap-1.5">
        <Drumstick
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="font-medium">Protein</span>
        <span className="text-muted-foreground">{fmt(protein)}g</span>
      </div>

      {/* Carbs */}
      <div className="flex items-center justify-center gap-1.5">
        <Wheat className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Carbs</span>
        <span className="text-muted-foreground">{fmt(carbs)}g</span>
      </div>

      {/* Fat */}
      <div className="flex items-center justify-center gap-1.5">
        <Droplet className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Fat</span>
        <span className="text-muted-foreground">{fmt(fat)}g</span>
      </div>
    </div>
  );
}
