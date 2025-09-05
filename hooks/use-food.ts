/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFoodAnalysis.ts
import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@clerk/nextjs";

export interface FoodAnalysisContext {
  userInfo?: string;
  totalMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  consumedMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface FoodItem {
  name: string;
  quantity: string;
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface Suggestion {
  shouldEat: boolean;
  reason: string;
  recommendedQuantity?: string;
  alternatives?: string[];
  mealCompletionSuggestions?: Array<{
    name: string;
    quantity: string;
    macros: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    reason: string;
  }>;
  completeMealMacros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface AnalysisData {
  foodItems: FoodItem[];
  totalMacros: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  suggestion?: Suggestion;
}

interface FoodAnalysisResult {
  success: boolean;
  data?: AnalysisData;
  analysisType?: "image" | "text";
  contextProvided?: boolean;
  hasRecommendation?: boolean;
  hasComplementaryFoods?: boolean;
  recommendsEating?: boolean;
  timestamp?: string;
  error?: string;
  details?: string;
}

interface UseFoodAnalysisReturn {
  analyzeImage: (
    imageUrl: string,
    context?: FoodAnalysisContext,
  ) => Promise<FoodAnalysisResult>;
  analyzeText: (
    foodName: string,
    quantity: string,
    context?: FoodAnalysisContext,
  ) => Promise<FoodAnalysisResult>;
  analyzing: boolean;
  error: string | null;
  result: FoodAnalysisResult | null;
  reset: () => void;
}

export const useFoodAnalysis = (): UseFoodAnalysisReturn => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);

  const { getToken } = useAuth();
  const analyzeImage = useCallback(
    async (
      imageUrl: string,
      context?: FoodAnalysisContext,
    ): Promise<FoodAnalysisResult> => {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const token = await getToken();
      try {
        const response = await api.post<FoodAnalysisResult>(
          "/food/image",
          {
            imageUrl,
            context,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setResult(response.data);
        return response.data;
      } catch (err: any) {
        let message = "Failed to analyze image";

        if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.data?.details) {
          message = err.response.data.details;
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
        throw new Error(message);
      } finally {
        setAnalyzing(false);
      }
    },
    [],
  );

  const analyzeText = useCallback(
    async (
      foodName: string,
      quantity: string,
      context?: FoodAnalysisContext,
    ): Promise<FoodAnalysisResult> => {
      setAnalyzing(true);
      setError(null);
      setResult(null);
      console.log(context);
      const token = await getToken();
      try {
        const response = await api.post<FoodAnalysisResult>(
          "/food/text",
          {
            foodName: foodName.trim(),
            quantity: quantity.trim(),
            context,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        setResult(response.data);
        return response.data;
      } catch (err: any) {
        let message = "Failed to analyze text input";

        if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.data?.details) {
          message = err.response.data.details;
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
        throw new Error(message);
      } finally {
        setAnalyzing(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setAnalyzing(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    analyzeImage,
    analyzeText,
    analyzing,
    error,
    result,
    reset,
  };
};

interface MacroSuggestionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  explanation?: string;
}

interface UseMacroSuggestionReturn {
  getSuggestion: (
    userDetails: string,
    age: number,
  ) => Promise<MacroSuggestionData | null>;
  loading: boolean;
  error: string | null;
  data: MacroSuggestionData | null;
  reset: () => void;
}

export const useMacroSuggestion = (): UseMacroSuggestionReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MacroSuggestionData | null>(null);

  const { getToken } = useAuth();

  const getSuggestion = useCallback(
    async (
      userDetails: string,
      age: number,
    ): Promise<MacroSuggestionData | null> => {
      setLoading(true);
      setError(null);
      setData(null);

      const token = await getToken();
      console.log(userDetails);
      try {
        const response = await api.post(
          "/food/suggest",
          {
            userDetails,
            age,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const apiData = response.data?.data;
        let macros;
        let explanation;

        if (apiData?.macros) {
          macros = apiData.macros;
          explanation = apiData.explanation;
        } else {
          macros = {
            calories: apiData?.calories,
            protein: apiData?.protein,
            carbs: apiData?.carbs,
            fat: apiData?.fat,
          };
          explanation = apiData?.explanation;
        }

        const result: MacroSuggestionData = {
          calories: macros?.calories ?? 0,
          protein: macros?.protein ?? 0,
          carbs: macros?.carbs ?? 0,
          fat: macros?.fat ?? 0,
          explanation: explanation ?? "",
        };

        setData(result);
        return result;
      } catch (err: any) {
        console.log(err.message, "meoi");
        let message = "Failed to fetch macro suggestion";
        if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.data?.details) {
          message = err.response.data.details;
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    getSuggestion,
    loading,
    error,
    data,
    reset,
  };
};

interface ExtractedFood {
  name: string;
  quantity?: string;
}

interface FoodExtractionResult {
  success: boolean;
  extracted?: ExtractedFood;
  error?: string;
  details?: string;
  analysisType: "natural_language_extraction";
  input: {
    prompt: string;
  };
  metadata: {
    timestamp: string;
    analysisDuration?: string;
    aiModel: string;
    hasQuantity: boolean;
  };
}

interface UseFoodExtractionReturn {
  extractFood: (prompt: string) => Promise<ExtractedFood | null>;
  extracting: boolean;
  error: string | null;
  result: FoodExtractionResult | null;
  reset: () => void;
}

export const useFoodExtraction = (): UseFoodExtractionReturn => {
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodExtractionResult | null>(null);

  const { getToken } = useAuth();

  const extractFood = useCallback(
    async (prompt: string): Promise<ExtractedFood | null> => {
      setExtracting(true);
      setError(null);
      setResult(null);

      const token = await getToken();

      try {
        const response = await api.post<FoodExtractionResult>(
          "/food/voice",
          {
            prompt,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        console.log(response.data, "data");
        setResult(response.data);
        return response.data.extracted || null;
      } catch (err: any) {
        let message = "Failed to extract food from prompt";

        if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.data?.details) {
          message = err.response.data.details;
        } else if (err.message) {
          message = err.message;
        }

        setError(message);
        return null;
      } finally {
        setExtracting(false);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setExtracting(false);
    setError(null);
    setResult(null);
  }, []);

  return {
    extractFood,
    extracting,
    error,
    result,
    reset,
  };
};
