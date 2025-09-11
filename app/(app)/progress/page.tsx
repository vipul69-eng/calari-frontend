"use client";
import type React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNutritionStore } from "@/store/nutrition-store";
import { useUserStore } from "@/store/user-store";
import { useAuth } from "@clerk/nextjs"; // Updated import path
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  TrendingUp,
  Flame,
  Target,
  Calendar,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import MealDistributionCharts from "@/components/charts/meals-charts";

interface DayData {
  date: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

const AnalyticsPage: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [error, setError] = useState<string | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<string>("calories");
  const { getToken } = useAuth();
  const isMounted = useRef(true);

  const { user } = useUserStore();

  const {
    fetchNutritionAnalytics,
    fetchMealHistory,
    getNutritionAnalytics,
    isLoadingAnalytics,
    isLoadingHistory,
    getMealHistory,
    clearAnalyticsData,
  } = useNutritionStore();

  const nutritionAnalytics = getNutritionAnalytics();
  const mealHistory = getMealHistory();
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  const fetchAnalyticsData = useCallback(
    async (days: number) => {
      if (!isMounted.current) return;
      setError(null);
      try {
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        const token = await getToken();
        if (!token || !isMounted.current) return;

        await Promise.all([
          fetchNutritionAnalytics(days, token),
          fetchMealHistory(
            {
              startDate,
              endDate,
              limit: days,
            },
            token,
          ),
        ]);
      } catch (err) {
        if (isMounted.current) {
          console.error("Failed to fetch analytics data:", err);
          setError("Failed to load analytics data. Please try again.");
        }
      }
    },
    [fetchNutritionAnalytics, fetchMealHistory, getToken],
  );

  useEffect(() => {
    isMounted.current = true;
    fetchAnalyticsData(selectedDays);
    return () => {
      isMounted.current = false;
      clearAnalyticsData();
    };
  }, [selectedDays, fetchAnalyticsData, clearAnalyticsData]);

  // Process data for charts
  const processChartData = () => {
    if (!nutritionAnalytics?.dailyData) return [];

    return nutritionAnalytics.dailyData.map((day: DayData) => ({
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      calories: day.macros.calories,
      protein: day.macros.protein,
      carbs: day.macros.carbs,
      fat: day.macros.fat,
      hasData: day.macros.calories > 0,
    }));
  };

  const chartData = processChartData();
  const loggedDays = chartData.filter((day) => day.hasData).length;
  const consistencyRate = Math.round((loggedDays / selectedDays) * 100);

  // Calculate averages from logged days only
  const loggedOnlyData = chartData.filter((day) => day.hasData);
  const avgCalories =
    loggedOnlyData.length > 0
      ? Math.round(
          loggedOnlyData.reduce((sum, day) => sum + day.calories, 0) /
            loggedOnlyData.length,
        )
      : 0;

  const calculateProgress = (actual: number, goal: number) => {
    return goal > 0 ? Math.min(Math.round((actual / goal) * 100), 100) : 0;
  };

  const getTodaysData = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yesterdayStr = yesterday.toISOString().split("T")[0];
    console.log(today);
    const todayData = nutritionAnalytics?.dailyData?.find(
      (day: DayData) => day.date.split("T")[0] === yesterdayStr,
    );

    console.log(nutritionAnalytics?.dailyData);
    if (todayData) {
      return {
        calories: todayData.macros.calories,
        protein: todayData.macros.protein,
        carbs: todayData.macros.carbs,
        fat: todayData.macros.fat,
      };
    }

    // If no data for today, return zeros
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    };
  };

  const todaysData = getTodaysData();
  const macroGoals = user?.profile.macros || {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 67,
  };

  const todayCalorieProgress = calculateProgress(
    todaysData.calories,
    macroGoals.calories,
  );
  const todayProteinProgress = calculateProgress(
    todaysData.protein,
    macroGoals.protein,
  );
  const todayCarbsProgress = calculateProgress(
    todaysData.carbs,
    macroGoals.carbs,
  );
  const todayFatProgress = calculateProgress(todaysData.fat, macroGoals.fat);

  const RadialStackChart = ({
    calorieProgress,
    proteinProgress,
    carbsProgress,
    fatProgress,
  }: {
    calorieProgress: number;
    proteinProgress: number;
    carbsProgress: number;
    fatProgress: number;
  }) => {
    const data = [
      {
        name: "Calories",
        value: calorieProgress,
        fill: "#FF453A",
      },
      {
        name: "Protein",
        value: proteinProgress,
        fill: "#30D158",
      },
      {
        name: "Carbs",
        value: carbsProgress,
        fill: "#FF9F0A",
      },
      {
        name: "Fat",
        value: fatProgress,
        fill: "#007AFF",
      },
    ];

    const overallProgress = Math.round(
      (calorieProgress + proteinProgress + carbsProgress + fatProgress) / 4,
    );

    return (
      <div className="w-full max-w-sm mx-auto p-4 rounded-2xl">
        {/* Chart Container */}
        <div className="relative flex items-center justify-center mb-6">
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="50%"
              outerRadius="85%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar
                dataKey="value"
                cornerRadius={6}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#F9FAFB",
                }}
                formatter={(value: number, name: string) => [`${value}%`, name]}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          {/* Center Progress Display */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">
                {overallProgress}%
              </div>
              <div className="text-sm text-gray-400 font-medium">Complete</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {data.map((item) => (
              <div
                key={item.name}
                className="flex items-center space-x-3 rounded-lg"
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <div className="flex-1 flex min-w-0 gap-2 items-center">
                  <div className="text-sm font-medium text-white truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-400">{item.value}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const prepareStackedBarData = () => {
    return chartData.map((day) => ({
      date: day.date,
      protein: day.protein.toFixed(2),
      carbs: day.carbs.toFixed(2),
      fat: day.fat.toFixed(2),
      hasData: day.hasData,
    }));
  };

  const stackedBarData = prepareStackedBarData();

  if (isLoadingAnalytics || isLoadingHistory) {
    return (
      <div className="min-h-screen bg-black text-white pb-24">
        <div className="px-4 pt-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-1 bg-neutral-800" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-8 bg-neutral-800" />
              <Skeleton className="h-8 w-8 bg-neutral-800" />
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-900/40 rounded-2xl p-4 text-center border border-neutral-800/50">
              <Skeleton className="h-8 w-16 mx-auto mb-1 bg-neutral-700" />
              <Skeleton className="h-4 w-20 mx-auto mb-1 bg-neutral-700" />
              <Skeleton className="h-3 w-16 mx-auto bg-neutral-700" />
            </div>
            <div className="bg-neutral-900/40 rounded-2xl p-4 text-center border border-neutral-800/50">
              <Skeleton className="h-8 w-16 mx-auto mb-1 bg-neutral-700" />
              <Skeleton className="h-4 w-20 mx-auto mb-1 bg-neutral-700" />
              <Skeleton className="h-3 w-16 mx-auto bg-neutral-700" />
            </div>
          </div>
        </div>

        <div className="px-4 space-y-6">
          {/* Today's Progress skeleton */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-5 bg-neutral-700" />
              <Skeleton className="h-6 w-40 bg-neutral-700" />
            </div>
            <div className="bg-neutral-900/30 backdrop-blur-sm rounded-3xl p-6 border border-neutral-800/50 mb-6">
              <div className="flex flex-col items-center">
                <Skeleton className="h-48 w-48 rounded-full bg-neutral-700" />
              </div>
            </div>
          </div>

          {/* Weekly Calories chart skeleton */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-5 bg-neutral-700" />
              <Skeleton className="h-6 w-32 bg-neutral-700" />
            </div>
            <div className="h-64 bg-neutral-900/30 backdrop-blur-sm rounded-3xl p-4 border border-neutral-800/50">
              <Skeleton className="h-full w-full bg-neutral-700" />
            </div>
          </div>

          {/* Weekly Macros chart skeleton */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-5 bg-neutral-700" />
              <Skeleton className="h-6 w-32 bg-neutral-700" />
            </div>
            <div className="h-64 bg-neutral-900/30 backdrop-blur-sm rounded-3xl p-4 border border-neutral-800/50">
              <Skeleton className="h-full w-full bg-neutral-700" />
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="grid grid-cols-2 gap-3 pb-12">
            <Skeleton className="h-12 rounded-2xl bg-neutral-700" />
            <Skeleton className="h-12 rounded-2xl bg-neutral-700" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-black text-white pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              onClick={() => {
                console.log(mealHistory);
              }}
              className="text-3xl font-bold text-white mb-1"
            >
              Your Progress
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1 text-sm">
              {selectedDays}d
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 bg-neutral-900 hover:text-white flex items-center gap-1"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-neutral-900 border-neutral-700 text-white"
              >
                <DropdownMenuItem
                  onClick={() => setSelectedDays(7)}
                  className={`cursor-pointer hover:bg-neutral-800 ${
                    selectedDays === 7 ? "bg-neutral-800 text-green-400" : ""
                  }`}
                >
                  7 Days
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedDays(30)}
                  className={`cursor-pointer hover:bg-gray-800 ${
                    selectedDays === 30 ? "bg-gray-800 text-green-400" : ""
                  }`}
                >
                  30 Days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div
            className="bg-neutral-900/40 rounded-2xl p-4 text-center border border-neutral-800/50 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              {/* Progress ring background */}
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <svg
                  className="w-16 h-16 transform -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#374151"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#10B981"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${calculateProgress(avgCalories, macroGoals.calories) * 1.76} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-400 mb-1">
                {calculateProgress(avgCalories, macroGoals.calories)}%
              </div>
              <div className="text-xs text-gray-400 font-medium">
                on target daily
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-neutral-900/40 rounded-2xl p-4 text-center border border-neutral-800/50 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative">
              {/* Progress ring for consistency */}
              <div className="w-16 h-16 mx-auto mb-3 relative">
                <svg
                  className="w-16 h-16 transform -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#374151"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#1db954"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${consistencyRate * 1.76} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="text-2xl font-bold text-green-400 mb-1">
                {consistencyRate}%
              </div>
              <div className="text-xs text-gray-400 font-medium mb-2">
                Consistent
              </div>

              {/* Visual day indicators */}
            </div>
          </motion.div>
        </div>
      </motion.div>
      <div className="px-4 space-y-6">
        {avgCalories > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <Flame className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">
                {selectedDays == 7 ? "Weekly" : "Monthly"} Calories
              </h2>
            </div>
            <div className="h-64 bg-neutral-900/30 backdrop-blur-sm rounded-3xl p-4 border border-neutral-800/50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "16px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                      color: "#F9FAFB",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="#FF453A"
                    strokeWidth={3}
                    dot={{ fill: "#FF453A", strokeWidth: 2, r: 4 }}
                    activeDot={{
                      r: 6,
                      stroke: "#FF453A",
                      strokeWidth: 2,
                      fill: "#000",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {avgCalories > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5" />
              <h2 className="text-xl font-semibold text-white">
                {selectedDays === 7 ? "Weekly" : "Monthly"} Macros
              </h2>
            </div>
            <div className="h-64 bg-neutral-900/30 backdrop-blur-sm rounded-3xl p-4 border border-neutral-800/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackedBarData}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "16px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                      color: "#F9FAFB",
                    }}
                  />
                  <Bar
                    dataKey="protein"
                    stackId="macros"
                    fill="#00BFA5"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="carbs"
                    stackId="macros"
                    fill="#FF7043"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="fat"
                    stackId="macros"
                    fill="#7E57C2"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div variants={itemVariants} className="px-4 mt-8">
        <MealDistributionCharts mealHistory={mealHistory} />
      </motion.div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AnalyticsPage;
