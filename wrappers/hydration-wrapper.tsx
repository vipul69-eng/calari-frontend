"use client";
import { ReactNode, useEffect, useState } from "react";

export const HydrationWrapper = ({ children }: { children: ReactNode }) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null;
  }
  return <>{children}</>;
};
