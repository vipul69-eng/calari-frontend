"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLoadingStore } from "@/store/loading-store";

export function OuterLoading() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  const { hasLoadedOnce, setLoaded } = useLoadingStore();

  useEffect(() => {
    if (!hasLoadedOnce) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        setLoaded(); // mark as loaded globally
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true); // instantly show, no delay
    }
  }, [hasLoadedOnce, setLoaded]);

  const visibleRoutes = ["/calari", "/"];
  const shouldShow = visibleRoutes.includes(pathname);
  if (!shouldShow) return null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center overflow-hidden">
      <div
        className={`flex flex-col items-center justify-center transition-all duration-1000 ${
          isVisible ? "animate-fade-in" : "opacity-0"
        }`}
      >
        <div className="relative">
          <div className="text-primary text-9xl md:text-[12rem] lg:text-[16rem] font-bold font-sans animate-pulse-glow select-none">
            C
          </div>
          <div className="absolute inset-0 text-primary text-9xl md:text-[12rem] lg:text-[16rem] font-bold font-sans blur-sm opacity-30 animate-pulse-glow select-none">
            C
          </div>
        </div>
        <div className="mt-8 text-primary text-2xl md:text-3xl lg:text-4xl font-light tracking-[0.2em] uppercase animate-fade-in select-none">
          Calari
        </div>
      </div>

      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
      </div>
    </main>
  );
}
