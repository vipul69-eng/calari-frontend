"use client";
import { ReactNode, useEffect, useState } from "react";
import CalariLoading from "@/components/ui/loading";

export const HydrationWrapper = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <CalariLoading />;
  }
  return <>{children}</>;
};
