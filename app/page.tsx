"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  useUser as useClerkUser,
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Camera,
  Wand2,
  ListChecks,
  Shield,
  Zap,
} from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { useGetUser, useUpsertUser } from "@/hooks/use-user";
import { useMealCountStore } from "@/store/use-count";
import { useRouter } from "next/navigation";
import { InstallButton } from "@/components/landing/install-pwa";
import { InstallInstructions } from "@/components/landing/install-instructions";
import CalariLoading from "@/components/ui/loading";
import { useRecipeHook } from "@/hooks/use-recipes";

export default function LandingApp() {
  const { user: clerkUser } = useClerkUser();
  const savedUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  const { data: fetchedUser, error: fetchError, loading } = useGetUser(email);
  const { upsertUser, data: upsertData } = useUpsertUser();
  const { fetchMealCount } = useMealCountStore();
  const router = useRouter();
  const { getToken } = useAuth();
  const fetchRecipes = useUserStore((state) => state.fetchRecipes);

  const onGoToApp = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.error("No token found — cannot fetch user data.");
        router.push("/login"); // Or fallback screen
        return;
      }

      // Fetch meal count and recipes in parallel
      if (!token) return;
      await Promise.all([fetchMealCount(token), fetchRecipes(token)]);

      if (savedUser) {
        const profile = savedUser.profile || {};
        const isProfileIncomplete =
          !profile.name || !profile.age || !profile.macros;

        router.push(isProfileIncomplete ? "/profile" : "/home");
      } else {
        router.push("/home");
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      // Optional: show a toast or fallback navigation
      router.push("/home");
    }
  };

  const handleAutoRedirect = () => {
    if (clerkUser && savedUser && !isRedirecting) {
      setIsRedirecting(true);
      onGoToApp();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    if (email && fetchError && !loading && !fetchedUser) {
      const is404Error =
        fetchError.includes("User not found") || fetchError.includes("404");

      if (is404Error) {
        upsertUser({
          email,
          plan: "basic",
          profile: {},
        });
      }
    }
  }, [email, fetchError, loading, fetchedUser, upsertUser]);

  useEffect(() => {
    if (upsertData) {
      setUser(upsertData);
    }
  }, [upsertData, setUser]);

  useEffect(() => {
    if (!isInitialLoading && clerkUser && savedUser) {
      handleAutoRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialLoading, clerkUser, savedUser]);

  if (
    isInitialLoading ||
    (clerkUser && !savedUser && loading) ||
    isRedirecting
  ) {
    return <CalariLoading />;
  }

  if (clerkUser && savedUser) {
    return <CalariLoading />;
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Calari</h1>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it Works
                </a>
                <a
                  href="#install-instructions"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  App
                </a>
                <a
                  href="#testimonials"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reviews
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <SignedOut>
                <SignInButton mode="modal" appearance={{ theme: "simple" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="active:scale-95 transition-transform duration-75 bg-transparent"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <SignOutButton>
                  <Button
                    variant="outline"
                    size="sm"
                    className="active:scale-95 transition-transform duration-75 bg-transparent"
                  >
                    Sign Out
                  </Button>
                </SignOutButton>
                {savedUser ? (
                  <Button
                    onClick={onGoToApp}
                    size="sm"
                    className="active:scale-95 transition-transform duration-75"
                  >
                    Go to App
                  </Button>
                ) : (
                  <Button disabled size="sm">
                    Loading...
                  </Button>
                )}
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Camera-first
              <span className="block text-primary">Food Tracking</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Transform your health journey with AI-powered nutrition tracking.
              Simply point, snap, and track your meals with unprecedented
              accuracy.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <SignedOut>
                <SignInButton mode="modal" appearance={{ theme: "simple" }}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold active:scale-95 transition-transform duration-75"
                  >
                    Start Tracking Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                {savedUser ? (
                  <Button
                    onClick={onGoToApp}
                    size="lg"
                    className="h-12 px-8 text-base font-semibold active:scale-95 transition-transform duration-75"
                  >
                    Go to App
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    Loading...
                  </Button>
                )}
              </SignedIn>
              <InstallButton />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              By clicking you agree to T&C • Free forever plan available
            </p>

            <div className="mt-8 flex justify-center">
              <InstallInstructions />
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary to-accent opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything you need to track nutrition
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed to make healthy eating effortless and
              sustainable.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <FeatureCard
                icon={<Camera className="h-6 w-6" />}
                title="Instant Photo Recognition"
                description="Advanced AI identifies foods, portions, and nutritional content from a single photo with 95% accuracy."
              />
              <FeatureCard
                icon={<Wand2 className="h-6 w-6" />}
                title="Smart Recommendations"
                description="Get personalized meal suggestions and nutrition tips based on your goals and dietary preferences."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Lightning Fast"
                description="Log meals in under 3 seconds. No more tedious manual entry or searching through databases."
              />
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Privacy First"
                description="Your health data stays secure with end-to-end encryption and complete privacy controls."
              />
            </dl>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-muted py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How Calari Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to transform your nutrition tracking
              experience.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <StepCard
                step="01"
                title="Snap a Photo"
                description="Simply point your camera at your meal and take a photo. Our AI works instantly to identify everything on your plate."
                icon={<Camera className="h-8 w-8 text-primary" />}
              />
              <StepCard
                step="02"
                title="Review & Confirm"
                description="Check the AI's analysis and make any quick adjustments. The system learns from your corrections to improve accuracy."
                icon={<Wand2 className="h-8 w-8 text-primary" />}
              />
              <StepCard
                step="03"
                title="Track Progress"
                description="View your nutrition dashboard, get personalized insights, and stay motivated with progress tracking."
                icon={<ListChecks className="h-8 w-8 text-primary" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Ready to transform your nutrition?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/90">
              Join thousands of users who have already revolutionized their
              health journey with Calari.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <SignedOut>
                <SignInButton mode="modal" appearance={{ theme: "simple" }}>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base font-semibold active:scale-95 transition-transform duration-75"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                {savedUser ? (
                  <Button
                    onClick={onGoToApp}
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base font-semibold active:scale-95 transition-transform duration-75"
                  >
                    Go to App
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    variant="secondary"
                    className="h-12 px-8 text-base font-semibold"
                  >
                    Loading...
                  </Button>
                )}
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center">
              <h3 className="text-xl font-bold text-primary">Calari</h3>
            </div>
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <a
                href="/legal/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/legal/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="mailto:admin@polygot.tech"
                target="_blank"
                className="hover:text-foreground transition-colors"
                rel="noreferrer"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Calari. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col">
      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-foreground">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {icon}
        </div>
        {title}
      </dt>
      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-muted-foreground">
        <p className="flex-auto">{description}</p>
      </dd>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <span className="text-4xl font-bold text-primary/20">{step}</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
