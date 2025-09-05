"use client";
import Link from "next/link";
import type React from "react";
import { useEffect, useState, useRef } from "react";

import { usePathname, useRouter } from "next/navigation";
import { User, Utensils, Plus, Scan } from "lucide-react";
import { useUserStore } from "@/store/user-store";

export default function AppNav({
  hiddenRoutes = ["track"],
}: {
  hiddenRoutes?: string[];
}) {
  const pathname = usePathname() || "/";
  const { user } = useUserStore();
  const router = useRouter();

  // Popover state, refs, and route prefetching
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Prefetch the routes once to make navigation smooth
  useEffect(() => {
    router.prefetch("/track");
    router.prefetch("/profile/recipes");
  }, [router]);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Also prefetch when opening the menu (in case of cold start)
  useEffect(() => {
    if (menuOpen) {
      router.prefetch("/track");
      router.prefetch("/profile/recipes");
    }
  }, [menuOpen, router]);

  // Hide nav on matching routes
  const hidden = hiddenRoutes.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  if (hidden) return null;

  const isProfileComplete =
    user?.profile.name &&
    user?.profile.age &&
    user?.profile.macros &&
    user?.profile.height &&
    user?.profile.weight;
  if (!isProfileComplete) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 pb-safe"
        aria-label="Primary"
      >
        <div className="relative w-full px-4 pb-4">
          {/* Bottom bar content: card + add button */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-6 rounded-full border border-neutral-200 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-sm supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-black/30 dark:supports-[backdrop-filter]:bg-neutral-900/60 w-full justify-center">
              <NavIcon
                href="/home"
                label="Home"
                active={isActive("/home")}
                id="home"
              >
                <Utensils className="h-5 w-5" />
              </NavIcon>

              <NavIcon
                href="/profile"
                label="Profile"
                active={isActive("/profile")}
                id="profile"
              >
                <User className="h-5 w-5" />
              </NavIcon>
            </div>

            <div className="relative mx-4 flex items-center">
              <button
                ref={triggerRef}
                type="button"
                aria-label="Add"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                onMouseEnter={() => {
                  // warm prefetch on hover
                  router.prefetch("/track");
                  router.prefetch("/profile/recipes");
                }}
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
                style={{
                  WebkitTouchCallout: "none",
                  WebkitUserSelect: "none",
                  userSelect: "none",
                }}
                className="inline-flex h-16 w-16 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-neutral-200 bg-white/80 text-neutral-700 shadow-lg backdrop-blur-sm transition-transform duration-150 hover:bg-white active:scale-95 supports-[backdrop-filter]:bg-white/60 dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300 dark:supports-[backdrop-filter]:bg-neutral-900/60"
              >
                <Plus className="h-7 w-7" />
              </button>

              {menuOpen && (
                <div
                  ref={menuRef}
                  role="menu"
                  aria-label="Add options"
                  className="absolute bottom-20 right-0 z-50 w-44 rounded-xl border border-neutral-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm supports-[backdrop-filter]:bg-white/80 dark:border-neutral-800 dark:bg-neutral-900/90 dark:supports-[backdrop-filter]:bg-neutral-900/80"
                >
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/track");
                    }}
                  >
                    <Scan className="h-4 w-4" />
                    <span>Scan</span>
                  </button>
                  <button
                    role="menuitem"
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push("/profile/recipes");
                    }}
                  >
                    <Utensils className="h-4 w-4" />
                    <span>Recipes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function NavIcon({
  href,
  children,
  label,
  active = false,
  id,
  highlighted = false,
}: {
  href: string;
  children: React.ReactNode;
  label: string;
  active?: boolean;
  id?: string;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      id={id}
      className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-[11px] transition-all duration-300
      ${
        active
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
      }
      ${highlighted ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-neutral-900 scale-110" : ""}
      focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900`}
    >
      {children}
      <span className="mt-0.5">{label}</span>
    </Link>
  );
}

export function useNavBar(hiddenRoutes: string[] = ["track"]) {
  const pathname = usePathname() || "/";
  const { user } = useUserStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if current route should hide the navbar
    const isHiddenRoute = hiddenRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    // Check if user profile is complete
    const isProfileComplete =
      user?.profile?.name &&
      user?.profile?.age &&
      user?.profile?.macros &&
      user?.profile?.height &&
      user?.profile?.weight;

    // Navbar is visible when:
    // 1. Current route is not in hiddenRoutes
    // 2. User profile is complete
    const shouldShowNavbar = !isHiddenRoute && isProfileComplete ? true : false;

    setIsVisible(shouldShowNavbar);
  }, [pathname, user, hiddenRoutes]);

  return {
    isVisible,
    isHiddenRoute: hiddenRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    ),
    isProfileComplete:
      user?.profile?.name && user?.profile?.age && user?.profile?.macros,
  };
}
