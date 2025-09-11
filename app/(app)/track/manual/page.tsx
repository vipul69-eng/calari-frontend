"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Camera, Plus, Search } from "lucide-react";
import { useFoodAnalysis, type FoodAnalysisContext } from "@/hooks/use-food";
import { AnalysisWrapper } from "@/components/track/analysis";
import { useCurrentDayNutrition, useUserStore } from "@/store";

export default function ManualEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();
  const currentDayNutrition = useCurrentDayNutrition();

  // Form state
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analysis state
  const [showAnalysis, setShowAnalysis] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const { analyzeText } = useFoodAnalysis();

  useEffect(() => {
    const foodParam = searchParams.get("food");
    const quantityParam = searchParams.get("quantity");

    if (foodParam) {
      setFoodName(decodeURIComponent(foodParam));
    }
    if (quantityParam) {
      setQuantity(decodeURIComponent(quantityParam));
    }
  }, [searchParams]);

  // User context for personalized recommendations
  const userContext: FoodAnalysisContext | undefined = useMemo(
    () =>
      user?.profile
        ? {
            userInfo: user.profile.profileText,
            totalMacros: user.profile.macros,
            consumedMacros: {
              calories: currentDayNutrition?.totalCalories,
              protein: currentDayNutrition?.totalProtein,
              carbs: currentDayNutrition?.totalCarbs,
              fat: currentDayNutrition?.totalFat,
            },
          }
        : undefined,
    [
      user?.profile,
      currentDayNutrition?.totalCalories,
      currentDayNutrition?.totalCarbs,
      currentDayNutrition?.totalProtein,
      currentDayNutrition?.totalFat,
    ],
  );

  // Check if profile is set up
  const profile = user?.profile;
  const isEmptyProfile = useMemo(() => {
    if (!profile) return true;
    if (Object.keys(profile).length === 0) return true;
    if (!profile.name || !profile.age || !profile.macros) return true;
    const macros = profile.macros;
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs)
      return true;
    return false;
  }, [profile]);

  const handleAnalyze = useCallback(async () => {
    if (!foodName.trim() || !quantity.trim()) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeText(
        foodName.trim(),
        quantity.trim(),
        userContext,
      );

      if (result?.success && result?.data) {
        setAnalysisResult(result);
        setShowAnalysis(true);
      } else {
        setAnalysisError("Failed to analyze food. Please try again.");
      }
    } catch (error) {
      setAnalysisError("An error occurred while analyzing the food.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [foodName, quantity, analyzeText, userContext]);

  const handleCloseAnalysis = useCallback(() => {
    setShowAnalysis(false);
    setAnalysisResult(null);
    setAnalysisError(null);
    // Clear form after successful analysis
    setFoodName("");
    setQuantity("");
  }, []);

  const isFormValid = foodName.trim() && quantity.trim();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.metaKey && isFormValid && !isAnalyzing) {
        handleAnalyze();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleAnalyze, isFormValid, isAnalyzing]);

  if (isEmptyProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-sm border border-border bg-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary rounded-full" />
            </div>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Create Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Create your profile to personalize your experience and track your
              preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push("/profile")}
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            >
              Create Profile
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Takes less than 2 minutes to set up
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              {/*<h1 className="text-lg font-semibold text-foreground">
                Manual Entry
              </h1>
              <p className="text-sm text-muted-foreground">Add food manually</p>*/}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/track/camera")}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Camera</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Entry Form */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Plus className="h-5 w-5 text-primary" />
              Add Food Item
            </CardTitle>
            <CardDescription>
              Enter the food name and quantity to get nutritional information
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="food-name" className="text-sm font-medium">
                Food Name
              </Label>
              <Input
                id="food-name"
                type="text"
                placeholder="e.g., Grilled chicken breast, Apple, Oatmeal..."
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="h-12"
                disabled={isAnalyzing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="text"
                placeholder="e.g., 1 cup, 100g, 2 slices, 1 medium..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-12"
                disabled={isAnalyzing}
              />
            </div>

            {analysisError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{analysisError}</p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={!isFormValid || isAnalyzing}
              className="w-full h-12 text-base font-medium"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Analyze Food
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="shadow-sm border border-border bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-medium text-sm mb-3 text-foreground">
              Tips for better results:
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Be specific with quantities (use grams, cups, pieces)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Include cooking method when relevant (grilled, baked, fried)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Use common food names for better recognition
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Wrapper */}
      <AnalysisWrapper
        analyzing={isAnalyzing}
        analysisError={analysisError}
        analysisResult={analysisResult}
        isOpen={showAnalysis}
        onClose={handleCloseAnalysis}
        redirectAfterAdd="/home"
        showEditButton={false}
        openManualCard={() => {}}
        handleRetry={() => {}}
      />
    </div>
  );
}
