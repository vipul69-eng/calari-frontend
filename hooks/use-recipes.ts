/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/api";
import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";

export interface Recipe {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  [key: string]: any;
}

export function useRecipeHook(autoFetch: boolean = true) {
  const { getToken } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Utility to add token automatically
  const withAuth = useCallback(async () => {
    const token = await getToken();
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [getToken]);

  /**
   * Fetch all recipes for the authenticated user
   */
  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = await withAuth();
      const res = await api.get("/recipes", auth);
      if (res.data.success) {
        setRecipes(res.data.data || []);
      } else {
        setError("Failed to load recipes");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }, [withAuth]);

  /**
   * Create a new recipe
   */
  const createRecipe = useCallback(
    async (recipe: Partial<Recipe>) => {
      try {
        setLoading(true);
        const auth = await withAuth();
        const res = await api.post("/recipes", recipe, auth);
        if (res.data.success) {
          setRecipes((prev) => [...prev, res.data.data]);
          return res.data.data;
        }
        throw new Error("Failed to create recipe");
      } catch (err: any) {
        setError(err.message || "Failed to create recipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [withAuth],
  );

  /**
   * Update an existing recipe
   */
  const updateRecipe = useCallback(
    async (recipeId: string, updates: Partial<Recipe>) => {
      try {
        setLoading(true);
        const auth = await withAuth();
        const res = await api.put(`/recipes/${recipeId}`, updates, auth);
        if (res.data.success) {
          setRecipes((prev) =>
            prev.map((r) => (r.id === recipeId ? res.data.data : r)),
          );
          return res.data.data;
        }
        throw new Error("Failed to update recipe");
      } catch (err: any) {
        setError(err.message || "Failed to update recipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [withAuth],
  );

  /**
   * Delete a recipe
   */
  const deleteRecipe = useCallback(
    async (recipeId: string) => {
      try {
        setLoading(true);
        const auth = await withAuth();
        const res = await api.delete(`/recipes/${recipeId}`, auth);
        if (res.data.success) {
          setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
          return true;
        }
        throw new Error("Failed to delete recipe");
      } catch (err: any) {
        setError(err.message || "Failed to delete recipe");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [withAuth],
  );

  /**
   * Sync multiple recipes (overwrite all)
   */
  const syncRecipes = useCallback(
    async (newRecipes: Recipe[]) => {
      try {
        setLoading(true);
        const auth = await withAuth();
        const res = await api.post(
          "/recipes/sync",
          { recipes: newRecipes },
          auth,
        );
        if (res.data.success) {
          setRecipes(res.data.data.recipes || []);
          return res.data.data;
        }
        throw new Error("Failed to sync recipes");
      } catch (err: any) {
        setError(err.message || "Failed to sync recipes");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [withAuth],
  );

  // Auto-fetch recipes on mount if enabled
  useEffect(() => {
    if (autoFetch) fetchRecipes();
  }, [autoFetch, fetchRecipes]);

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    syncRecipes,
  };
}
