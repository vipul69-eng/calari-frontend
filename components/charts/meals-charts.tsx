/** eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import type React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Drumstick } from "lucide-react";

interface FoodEntry {
  id: string;
  fat: number;
  carbs: number;
  protein: number;
  calories: number;
  foodName: string;
  quantity: string;
  createdAt: string;
  analysisData: {
    data: {
      suggestion: {
        shouldEat: boolean;
      };
    };
  };
}

interface MealHistoryDay {
  date: string;
  foodEntries: FoodEntry[];
  totalMacros: {
    fat: number;
    carbs: number;
    protein: number;
    calories: number;
  };
}

interface MealDistributionChartsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mealHistory: MealHistoryDay[] | any;
}

const COLORS = {
  Breakfast: "#00BFA5",
  Lunch: "#FF7043",
  Dinner: "#7E57C2",
  Snacks: "#AF52DE",
};

const MealDistributionCharts: React.FC<MealDistributionChartsProps> = ({
  mealHistory,
}) => {
  // Function to categorize meals by time of day
  const categorizeMealByTime = (createdAt: string) => {
    const hour = new Date(createdAt).getHours();
    if (hour >= 5 && hour < 11) return "Breakfast";
    if (hour >= 11 && hour < 16) return "Lunch";
    if (hour >= 16 && hour < 22) return "Dinner";
    return "Snacks";
  };

  const processMealDistribution = () => {
    const mealData = {
      Breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      Lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      Dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
      Snacks: { calories: 0, protein: 0, carbs: 0, fat: 0, count: 0 },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mealHistory.forEach((day: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      day.foodEntries.forEach((entry: any) => {
        const mealType = categorizeMealByTime(entry.createdAt);
        mealData[mealType].calories += entry.calories;
        mealData[mealType].protein += entry.protein;
        mealData[mealType].carbs += entry.carbs;
        mealData[mealType].fat += entry.fat;
        mealData[mealType].count += 1;
      });
    });

    // Calculate total calories for pie chart
    const totalCalories = Object.values(mealData).reduce(
      (sum, meal) => sum + meal.calories,
      0,
    );

    return Object.entries(mealData)
      .map(([mealType, data]) => ({
        name: mealType,
        value: data.calories,
        percentage:
          totalCalories > 0
            ? Math.round((data.calories / totalCalories) * 100)
            : 0,
        avgCalories:
          data.count > 0 ? Math.round(data.calories / data.count) : 0,
        count: data.count,
        fill: COLORS[mealType as keyof typeof COLORS],
      }))
      .filter((meal) => meal.count > 0);
  };

  const processShouldEatData = () => {
    let shouldEatTrue = 0;
    let shouldEatFalse = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mealHistory.forEach((day: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      day.foodEntries.forEach((entry: any) => {
        if (entry.analysisData?.data?.suggestion?.shouldEat === true) {
          shouldEatTrue++;
        } else if (entry.analysisData?.data?.suggestion?.shouldEat === false) {
          shouldEatFalse++;
        }
      });
    });

    return [
      {
        name: "Recommended",
        count: shouldEatTrue,
        fill: "#10B981",
      },
      {
        name: "Not Recommended",
        count: shouldEatFalse,
        fill: "#EF4444",
      },
    ];
  };

  const mealDistributionData = processMealDistribution();
  const shouldEatData = processShouldEatData();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-sm text-gray-300">{`${data.value} cal (${data.percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const HistogramTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-sm text-gray-300">{`${payload[0].value} foods`}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for slices smaller than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="600"
        className="drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="white"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        className="drop-shadow-lg"
      >
        {value}
      </text>
    );
  };

  if (mealDistributionData.length === 0 && shouldEatData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="bg-neutral-900/30 border-neutral-800/50">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No meal data available for analysis</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mealDistributionData.length > 0 && (
        <div className="">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">
              Calorie Distribution
            </h2>
          </div>

          <Card className="bg-neutral-900/40 backdrop-blur-sm border-neutral-800/60 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Pie Chart */}
                <div className="w-full md:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={mealDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={45}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {mealDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-x-2">
                  {mealDistributionData.map((meal) => (
                    <div key={meal.name} className="rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: meal.fill }}
                        />
                        <span className="text-white font-medium text-sm">
                          {meal.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {shouldEatData.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4 mt-8">
            <Drumstick className="w-5 h-5 text-white" />
            <h2 className="text-xl font-semibold text-white">Meals Eaten</h2>
          </div>

          <Card className="bg-neutral-900/40 backdrop-blur-sm border-neutral-800/60 shadow-lg">
            <CardContent className="p-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shouldEatData}
                    margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      width={35}
                    />
                    <Tooltip content={<HistogramTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={80}>
                      <LabelList content={renderBarLabel} />
                      {shouldEatData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-neutral-700/50">
                {shouldEatData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    {item.name === "Recommended" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-gray-300">
                      {item.count} foods
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MealDistributionCharts;
