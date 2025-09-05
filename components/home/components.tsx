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

export function MealCard({
  meal,
  deleteMeal,
  isDeleting,
}: {
  meal: MealDisplay;
  deleteMeal: () => void;
  isDeleting: boolean;
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleDelete = () => {
    deleteMeal();
    setIsPopoverOpen(false);
  };

  const handleCancel = () => {
    setIsPopoverOpen(false);
  };

  return (
    <article
      className={`p-4 pb-8 shadow-sm transition-all border-b duration-300 hover:shadow-md backdrop-blur-sm relative transform-gpu
        ${
          isDeleting
            ? "opacity-0 scale-95 translate-y-[-10px] pointer-events-none"
            : "opacity-100 scale-100 translate-y-0"
        }
        `}
      aria-label={`${meal.title}, ${meal.kcal} kilocalories`}
    >
      {/* Rest of your MealCard content stays the same */}
      <div className="flex items-center gap-3">
        <div className="flex items-start justify-between gap-4 w-full">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="text-left text-pretty font-semibold tracking-tight text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
                aria-haspopup="dialog"
                aria-label={`View foods in ${meal.title}`}
              >
                <h3 className="text-lg md:text-xl">
                  {meal.title
                    .split(" ")
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase(),
                    )
                    .join(" ")
                    .slice(0, 25)}
                  {meal.title.length > 25 ? "..." : ""}
                </h3>
              </button>

              {/* Delete Popover */}
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    aria-label={`Delete ${meal.title}`}
                    className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                    disabled={isDeleting}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3 space-y-2">
                  <p className="text-sm font-medium">Delete this meal?</p>
                  <p className="text-xs text-muted-foreground">
                    This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {meal.grams ? (
              <p className="mt-1 text-sm text-muted-foreground text-pretty">
                {meal.grams}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-4">
        {/* Total Calories - prominent */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
            {Math.round(meal.kcal)}
          </span>
          <span className="text-muted-foreground font-medium">kcal</span>
        </div>
        {/* Macros Row */}
        <MacrosRow
          protein={meal.macros.protein}
          carbs={meal.macros.carbs}
          fat={meal.macros.fat}
        />
      </div>
    </article>
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
