/** eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { X, Flame, Beef, Salad, Candy, Apple, Fish, Egg } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ManualEntryCardProps = {
  open: boolean;
  onClose: () => void;
  manualFoodName: string;
  setManualFoodName: (v: string) => void;
  manualQuantity: string;
  setManualQuantity: (v: string) => void;
  analyzing: boolean;
  onAnalyze: () => void;
  className?: string;
};

export function ManualEntryCard({
  open,
  onClose,
  manualFoodName,
  setManualFoodName,
  manualQuantity,
  setManualQuantity,
  analyzing,
  onAnalyze,
  className,
}: ManualEntryCardProps) {
  if (!open) return null;

  const qtyOptions = ["1 serving", "100g", "1 cup", "1 bowl"];

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-transparent backdrop-blur-sm animate-in fade-in-0 duration-200",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Nutrition details"
      aria-describedby="manual-entry-content"
    >
      {/* Panel: slide up from bottom with rounded top */}
      <div className="absolute inset-x-0 bottom-0 top-8 flex">
        <div className="mx-auto w-full max-w-md sm:max-w-lg md:max-w-xl h-full">
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 max-h-[calc(100vh-2rem)]",
              "rounded-t-3xl border bg-card shadow-lg",
              "animate-in slide-in-from-bottom-1 duration-300",
            )}
          >
            {/* Header */}
            <div className="relative flex items-center px-6 pt-5 pb-3">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-2 -translate-x-1/2 h-1.5 w-12 rounded-full bg-muted"
              />
              <h2
                id="manual-entry-title"
                className="text-base font-semibold text-card-foreground"
              >
                Log Your Meal
              </h2>
              <button
                type="button"
                aria-label="Close manual entry"
                onClick={onClose}
                className="ml-auto inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div
              id="manual-entry-content"
              className="px-6 pb-28 pt-2 overflow-y-auto"
            >
              <div className="mx-auto max-w-md">
                {/* Thematic top visual: food icon mosaic */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="rounded-full p-3 bg-muted/60">
                      <Apple
                        className="h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="rounded-full p-3 bg-muted/60">
                      <Beef
                        className="h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="rounded-full p-3 bg-muted/60">
                      <Salad
                        className="h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="rounded-full p-3 bg-muted/60">
                      <Fish
                        className="h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                    <div className="rounded-full p-3 bg-muted/60">
                      <Egg
                        className="h-5 w-5 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-sm text-muted-foreground">
                    {manualFoodName?.trim()
                      ? manualFoodName
                      : "Add a food and choose a quantity to preview nutrition"}
                  </p>
                </div>

                {/* Food Name Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="manual-food-name"
                    className="text-base font-medium text-card-foreground"
                  >
                    What are you eating?
                  </Label>
                  <Input
                    id="manual-food-name"
                    placeholder="e.g., Apple, Chicken breast, Smoothie"
                    value={manualFoodName}
                    onChange={(e) => setManualFoodName(e.target.value)}
                    className="h-12 bg-input border-border focus:ring-2 focus:ring-ring"
                    disabled={analyzing}
                    aria-describedby="manual-food-name-hint"
                  />
                  <p
                    id="manual-food-name-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Be specific for better nutrition estimates.
                  </p>
                </div>

                {/* Quantity Section */}
                <div className="mt-6 space-y-3">
                  <Label
                    htmlFor="manual-qty"
                    className="text-base font-medium text-card-foreground"
                  >
                    Quantity
                  </Label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {qtyOptions.map((opt) => {
                      const selected =
                        manualQuantity.trim().toLowerCase() === opt;
                      return (
                        <Button
                          key={opt}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          aria-pressed={selected}
                          className={cn(
                            "h-10 rounded-full text-sm",
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-background",
                          )}
                          onClick={() => setManualQuantity(opt)}
                          disabled={analyzing}
                        >
                          {opt}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="manual-qty-input"
                      className="text-sm text-muted-foreground"
                    >
                      Custom Quantity
                    </Label>
                    <Input
                      id="manual-qty-input"
                      placeholder="e.g., 250g, 2 cups"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(e.target.value)}
                      className="h-12 bg-input border-border focus:ring-2 focus:ring-ring"
                      disabled={analyzing}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom action bar */}
            <div className="pt-2 sticky bottom-0 left-0 right-0 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-t rounded-t-none rounded-b-3xl">
              <div className="px-6 py-4">
                <Button
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-base font-medium rounded-full"
                  onClick={onAnalyze}
                  disabled={
                    !manualFoodName.trim() ||
                    !manualQuantity.trim() ||
                    analyzing
                  }
                >
                  {analyzing ? "Analyzing..." : "View nutrition"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
