"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useUser as useClerkUser, SignedIn, SignedOut, SignInButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Wand2, ListChecks } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useGetUser, useUpsertUser } from "@/hooks/use-user";
import { useMealCountStore } from "@/store/use-count";
import { useRouter } from "next/navigation";

export default function LandingApp() {
  const { user: clerkUser } = useClerkUser();
  const savedUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const { data: fetchedUser, error: fetchError, loading } = useGetUser(email);
  const { upsertUser, data: upsertData } = useUpsertUser();
  const {fetchMealCount} = useMealCountStore()
  const router = useRouter()
  const {getToken}=useAuth()
  const onGoToApp=()=>{
    getToken().then(t=>{
fetchMealCount(t as string).then(()=>{
      router.push("/home")
    })
    })
    
  }

  useEffect(() => {
    if (!clerkUser && savedUser) {
      clearUser();
    }
  }, [clerkUser, savedUser, clearUser]);

  useEffect(() => {
    if (fetchedUser && email) {
      setUser(fetchedUser);
    }
  }, [fetchedUser, email, setUser]);

  // Handle user creation when user doesn't exist in backend
  useEffect(() => {
    if (email && fetchError && !loading && !fetchedUser) {
      // Only create user if we got a 404 (user not found)
      const is404Error = fetchError.includes("User not found") || fetchError.includes("404");
      
      if (is404Error) {
        upsertUser({
          email,
          plan: "basic",
          profile: {}
        });
      }
    }
  }, [email, fetchError, loading, fetchedUser, upsertUser]);

  // Handle successful user creation - update store
  useEffect(() => {
    if (upsertData) {
      setUser(upsertData);

    }
  }, [upsertData, setUser]);

  return (
    <main className="relative min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative z-10 grid min-h-[70vh] place-items-center px-6">
        <div className="mx-auto w-full max-w-lg text-center">
          <h1 className="select-none text-[clamp(44px,14vw,88px)] font-extrabold">
            Calari
          </h1>
          <p className="mx-auto mt-3 max-w-md text-white/90 text-sm sm:text-base">
            Camera-first food tracking and health management.
          </p>

          <div className="mt-6 flex items-center justify-center">
            <SignedOut>
              <SignInButton mode="modal" withSignUp appearance={{ theme: "simple" }}>
                <Button className="h-12 w-[min(340px,78vw)] rounded-xl bg-white text-black">
                  <span className="flex items-center justify-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {savedUser ? (
                  <Button onClick={onGoToApp} className="h-12 w-[min(340px,78vw)] rounded-xl bg-white text-black">
                    <span className="flex items-center justify-center gap-2">
                      Go to app <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
              ) : (
                <Button disabled className="h-12 w-[min(340px,78vw)] rounded-xl bg-gray-300 text-gray-600">
                  Loading...
                </Button>
              )}
            </SignedIn>
          </div>

          <div className="mt-2 text-xs opacity-85">
            No fuss. Open, snap, track.
          </div>

         
        </div>
      </section>

      {/* How Calari Helps Section */}
      <section
        id="overview"
        className="relative z-10 -mt-6 rounded-t-[28px] bg-white text-neutral-900"
        style={{ boxShadow: "0 -10px 40px rgba(0,0,0,0.15)" }}
      >
        <div className="mx-auto max-w-screen-sm px-5 py-10">
          <h2 className="text-center text-xl font-semibold">How Calari helps</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <OverviewCard
              icon={<Camera className="h-5 w-5 text-emerald-700" />}
              title="Scan quickly"
              desc="Point the camera, capture, and log."
            />
            <OverviewCard
              icon={<Wand2 className="h-5 w-5 text-emerald-700" />}
              title="Get suggestions"
              desc="Personalized tips to reach your goals."
            />
            <OverviewCard
              icon={<ListChecks className="h-5 w-5 text-emerald-700" />}
              title="Track simply"
              desc="Clear daily view to stay on track."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function OverviewCard({
  icon,
  title,
  desc
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        <div className="text-base font-semibold">{title}</div>
      </div>
      <p className="mt-2 text-sm text-neutral-600">{desc}</p>
    </div>
  );
}
