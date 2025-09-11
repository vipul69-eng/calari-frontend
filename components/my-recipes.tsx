"use client";

import { Drumstick } from "lucide-react";
import RecipeCard from "./recipe-card";
import { useRecipes } from "@/store";

export default function MyRecipes() {
  const recipes = useRecipes();
  if (recipes && recipes.length > 0) {
    return recipes.slice(0, Math.min(recipes.length, 2)).map((rp) => {
      return (
        <RecipeCard
          className="border-none bg-background"
          key={rp.id}
          meal={rp}
          showButtons={false}
        />
      );
    });
  }
  return (
    <div className="space-y-4">
      <div className="text-center py-12">
        <div
          onClick={() => {}}
          className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <Drumstick className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          No recipes yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Start creating your first recipe!
        </p>
      </div>
    </div>
  );
}
