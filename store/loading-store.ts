"use client";
import { create } from "zustand";

type LoadingState = {
  hasLoadedOnce: boolean;
  setLoaded: () => void;
};

export const useLoadingStore = create<LoadingState>((set) => ({
  hasLoadedOnce: false,
  setLoaded: () => set({ hasLoadedOnce: true }),
}));
