import { Droplet, Drumstick, Trash, Wheat } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { useState } from "react";

type StatProps = {
  value: number | string;
  label: string;
  progress: number;
  color: keyof typeof colorClasses;
  icon?: React.ElementType<{ className?: string }>;
  iconLabel?: string;
};

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
};

export const Stat: React.FC<StatProps> = ({
  value,
  label,
  progress,
  color,
  icon: Icon,
  iconLabel,
}) => {
  const colors = colorClasses[color];
  const pct = Math.min(progress, 100);

  return (
    <div className="flex flex-col items-center gap-3 p-3 rounded-2xl transition-shadow hover:shadow-sm">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={``} aria-hidden={!iconLabel}>
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </div>
        )}
        <div className="text-center sm:text-left">
          <div className={`text-lg sm:text-xl font-bold ${colors.text}`}>
            {value}g
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {label}
          </div>
        </div>
      </div>
      <div
        className="w-full"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${label} progress`}
        title={`${pct}%`}
      >
        <div className={`h-2 rounded-full ${colors.bgLight} overflow-hidden`}>
          <div
            className={`h-full ${colors.bg} transition-[width] duration-500 ease-out rounded-full`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

interface RingProps {
  value: number;
  center: string;
  sub: string;
  goal: number;
  remaining: number;
}

export type MealDisplay = {
  id: string;
  title: string;
  kcal: number;
  grams: string;
  timeLabel: string;
  macros: { protein: number; fat: number; carbs: number };
  emoji: string;
  color: "emerald" | "rose" | "amber" | "sky";
  analysisType?: "image" | "text";
};

export const Ring: React.FC<RingProps> = ({ value, center, sub }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = Math.round(
    circumference - (value / 100) * circumference,
  );

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-32 h-32 sm:w-36 sm:h-36">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
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
          <span className="text-2xl sm:text-3xl font-bold text-foreground">
            {Math.round(Number(center))}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground font-medium">
            {sub}
          </span>
        </div>
      </div>
    </div>
  );
};

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MealCard({
  meal,
  deleteMeal,
  isDeleting,
}: {
  meal: MealDisplay;
  deleteMeal: () => void;
  isDeleting: boolean;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleDelete = () => {
    deleteMeal();
    setIsSheetOpen(false);
  };

  const handleClose = () => {
    setIsSheetOpen(false);
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <article
          className={`p-4 pb-8 shadow-sm transition-all duration-300 hover:shadow-md backdrop-blur-sm relative transform-gpu cursor-pointer active:scale-[0.98] active:bg-muted/50
            ${
              isDeleting
                ? "opacity-0 scale-95 translate-y-[-10px] pointer-events-none"
                : "opacity-100 scale-100 translate-y-0"
            }
            `}
          aria-label={`${meal.title}, ${meal.kcal} kilocalories`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-start justify-between gap-4 w-full">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight text-foreground text-pretty">
                    {meal.title
                      .split(" ")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase(),
                      )
                      .join(" ")}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {Math.round(meal.kcal)}
              </span>
              <span className="text-muted-foreground font-medium">kcal</span>
            </div>
            <MacrosRow
              protein={meal.macros.protein}
              carbs={meal.macros.carbs}
              fat={meal.macros.fat}
            />
          </div>
        </article>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-0 px-6 py-8"
      >
        <SheetHeader className="text-center space-y-4">
          <SheetTitle className="text-2xl font-bold">
            {meal.title
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
              )
              .join(" ")}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <div className="bg-neutral-900 rounded-2xl p-6 space-y-4">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-foreground mb-2">
                {Math.round(meal.kcal)}
              </div>
              <div className="text-muted-foreground font-medium">calories</div>
            </div>

            {meal.grams && (
              <div className="text-center pt-2 border-t border-border/50">
                <div className="text-sm text-muted-foreground">Quantity</div>
                <div className="text-lg font-semibold text-foreground">
                  {meal.grams}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
              <div className="text-center">
                <Drumstick className="size-5 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Protein</div>
                <div className="text-lg font-semibold text-foreground">
                  {Number.isInteger(meal.macros.protein)
                    ? meal.macros.protein.toFixed(0)
                    : meal.macros.protein.toFixed(1)}
                  g
                </div>
              </div>
              <div className="text-center">
                <Wheat className="size-5 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Carbs</div>
                <div className="text-lg font-semibold text-foreground">
                  {Number.isInteger(meal.macros.carbs)
                    ? meal.macros.carbs.toFixed(0)
                    : meal.macros.carbs.toFixed(1)}
                  g
                </div>
              </div>
              <div className="text-center">
                <Droplet className="size-5 text-muted-foreground mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Fat</div>
                <div className="text-lg font-semibold text-foreground">
                  {Number.isInteger(meal.macros.fat)
                    ? meal.macros.fat.toFixed(0)
                    : meal.macros.fat.toFixed(1)}
                  g
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 text-base font-medium rounded-xl bg-transparent"
              onClick={handleClose}
            >
              Close
            </Button>
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 h-12 text-base font-medium rounded-xl"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash className="size-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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
      <div className="flex items-center justify-center gap-1.5">
        <Drumstick
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="font-medium">Protein</span>
        <span className="text-muted-foreground">{fmt(protein)}g</span>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <Wheat className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Carbs</span>
        <span className="text-muted-foreground">{fmt(carbs)}g</span>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        <Droplet className="size-4 text-muted-foreground" aria-hidden="true" />
        <span className="font-medium">Fat</span>
        <span className="text-muted-foreground">{fmt(fat)}g</span>
      </div>
    </div>
  );
}
