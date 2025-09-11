"use client";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  useUser,
} from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useCurrentUser, useUserStore } from "@/store";
import { OuterLoading } from "@/components/ui/loading";

export default function LandingApp() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const currentUser = useCurrentUser();
  const { user: u } = useUserStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // User is signed in, redirect immediately without showing landing page
        router.push("/calari");
      } else {
        // No user, show landing page
        setIsChecking(false);
      }
    }
  }, [isLoaded, user, router]);

  const onGoToApp = async () => {
    router.push("/calari");
  };

  if (isChecking || !isLoaded) {
    return <OuterLoading></OuterLoading>;
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Navbar */}
      <nav className="pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Calari</h1>
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-6 h-10 border-gray-600 text-white hover:bg-gray-800 transition-all duration-200 rounded-full font-medium bg-transparent"
                  >
                    Sign In
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-8 max-w-7xl mx-auto flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Your body called - it needs{" "}
                <span className="text-white">Calari</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                Track meals, create recipes, get suggestions from AI and hack
                your nurtition.
              </p>
            </div>
            {/* CTA Section */}
            <div className="space-y-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    size="lg"
                    className="h-14 px-8 text-lg font-semibold bg-white hover:bg-gray-100 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Start Tracking Free →
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                {isLoaded && user ? (
                  <Button
                    onClick={onGoToApp}
                    size="lg"
                    className="h-14 px-8 text-lg font-semibold bg-white hover:bg-gray-100 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Go to App →
                  </Button>
                ) : (
                  <Button
                    disabled
                    size="lg"
                    className="h-14 px-8 text-lg font-semibold rounded-full bg-gray-800 text-white"
                  >
                    Loading...
                  </Button>
                )}
              </SignedIn>
              <p className="text-gray-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                Free Plan. No card required
              </p>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 bg-gray-600 rounded-full border-2 border-black"></div>
                  <div className="w-8 h-8 bg-gray-500 rounded-full border-2 border-black"></div>
                  <div className="w-8 h-8 bg-gray-400 rounded-full border-2 border-black"></div>
                </div>
                <span className="text-sm text-gray-300 font-medium">
                  20+ users
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white">★★★★★</span>
                <span className="text-sm text-gray-300 font-medium">4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile-specific styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-visual-container {
            clip-path: inset(0 0 60% 0);
            height: 200px !important;
          }
        }

        @media (max-width: 768px) {
          body {
            overflow: hidden;
            height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
