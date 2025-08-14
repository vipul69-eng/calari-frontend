/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useFoodAnalysis.ts
import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@clerk/nextjs';

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
  analysisType?: 'image' | 'text';
  contextProvided?: boolean;
  hasRecommendation?: boolean;
  hasComplementaryFoods?: boolean;
  recommendsEating?: boolean;
  timestamp?: string;
  error?: string;
  details?: string;
}

interface UseFoodAnalysisReturn {
  analyzeImage: (imageUrl: string, context?: FoodAnalysisContext) => Promise<FoodAnalysisResult>;
  analyzeText: (foodName: string, quantity: string, context?: FoodAnalysisContext) => Promise<FoodAnalysisResult>;
  analyzing: boolean;
  error: string | null;
  result: FoodAnalysisResult | null;
  reset: () => void;
}

export const useFoodAnalysis = (): UseFoodAnalysisReturn => {
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  
  const {getToken} = useAuth()
  const analyzeImage = useCallback(
    async (imageUrl: string, context?: FoodAnalysisContext): Promise<FoodAnalysisResult> => {
      setAnalyzing(true);
      setError(null);
      setResult(null);
    

      const token = await getToken()
      try {

        const response = await api.post<FoodAnalysisResult>('/food/image', {
          imageUrl,
          context,
        }, {
            headers:{
                Authorization:`Bearer ${token}`
            }
        });

        setResult(response.data);
        return response.data;
      } catch (err: any) {
        let message = 'Failed to analyze image';
        
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
    []
  );

  const analyzeText = useCallback(
    async (foodName: string, quantity: string, context?: FoodAnalysisContext): Promise<FoodAnalysisResult> => {
      setAnalyzing(true);
      setError(null);
      setResult(null);

      const token = await getToken()
      try {

        const response = await api.post<FoodAnalysisResult>('/food/text', {
          foodName: foodName.trim(),
          quantity: quantity.trim(),
          context,
        }, {
            headers:{
                Authorization:`Bearer ${token}`
            }
        });

        setResult(response.data);
        return response.data;
      } catch (err: any) {
        let message = 'Failed to analyze text input';
        
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
    []
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
