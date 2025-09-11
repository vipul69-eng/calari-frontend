/** eslint-disable react-hooks/exhaustive-deps */
"use client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, useUser as useClerkUser } from "@clerk/nextjs";
import { useUserStore, useRecipeStore } from "@/store";
import { useGetUser, useUpsertUser } from "@/hooks/use-user";
import AppNav from "@/components/nav/nav-bar";
import { OuterLoading } from "@/components/ui/loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user: clerkUser } = useClerkUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const savedUser = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);
  const fetchRecipes = useRecipeStore((s) => s.fetchRecipes);

  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const { data: fetchedUser, error, loading } = useGetUser(email ?? undefined);
  const { upsertUser, data: upsertedUser } = useUpsertUser();

  // **NEW: Redirect to index if not logged in**
  useEffect(() => {
    if (isAuthLoaded && !clerkUser && pathname !== "/") {
      router.replace("/");
    }
  }, [isAuthLoaded, clerkUser, pathname, router]);

  // Clear user if signed out
  useEffect(() => {
    if (!clerkUser && savedUser) clearUser();
  }, [clerkUser, savedUser, clearUser]);

  // Set user if fetched
  useEffect(() => {
    if (fetchedUser && (!savedUser || fetchedUser.id !== savedUser?.id)) {
      setUser(fetchedUser);
    }
  }, [fetchedUser, savedUser?.id]);

  // Create user if not found (with redundancy prevention)
  useEffect(() => {
    if (email && !loading && error && !fetchedUser && !isCreatingUser) {
      if (error.includes("404") || error.toLowerCase().includes("not found")) {
        setIsCreatingUser(true);
        upsertUser({ email, plan: "basic", profile: {} }).finally(() =>
          setIsCreatingUser(false),
        );
      }
    }
  }, [email, error, loading, fetchedUser, isCreatingUser, upsertUser]);

  // Set user after upsert
  useEffect(() => {
    if (upsertedUser && (!savedUser || upsertedUser.id !== savedUser?.id)) {
      setUser(upsertedUser);
    }
  }, [upsertedUser, savedUser?.id]);

  // Profile completeness (optimized memoization)
  const isProfileIncomplete = useMemo(() => {
    const p = savedUser?.profile;
    return !p?.name || !p?.age || !p?.macros;
  }, [savedUser?.profile]);

  // Preload recipes (optimized with cleanup)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!savedUser?.id || !isAuthLoaded) return;
      try {
        const token = await getToken();
        if (token && !cancelled) {
          await fetchRecipes(token);
        }
      } catch (err) {
        console.error("Failed to fetch recipes:", err);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [savedUser?.id, isAuthLoaded]);

  // Redirect to profile if incomplete
  useEffect(() => {
    if (!clerkUser || !savedUser) return;
    if (isProfileIncomplete && pathname !== "/profile") {
      router.replace("/profile");
    }
  }, [clerkUser, savedUser, isProfileIncomplete, pathname, router]);

  // Loading guards
  if (!isAuthLoaded) return <OuterLoading></OuterLoading>;
  if (loading || isCreatingUser) return <OuterLoading></OuterLoading>;
  if (clerkUser && !savedUser) return <OuterLoading></OuterLoading>;

  return (
    <>
      <AppNav hiddenRoutes={["/", "/track", "/legal", "/calari"]} />
      {children}
    </>
  );
}
