"use client";
import Link from "next/link";
import type React from "react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  TrendingUp,
  User,
  ChefHat,
  Scan,
  PlusIcon,
  Edit2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function AppNav({
  hiddenRoutes = [],
}: {
  hiddenRoutes?: string[];
}) {
  const pathname = usePathname() || "/";
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const isHidden = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isHidden) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const getActiveIndex = () => {
    if (isActive("/home")) return 0;
    if (isActive("/progress")) return 1;
    if (isActive("/profile")) return 2;
    return -1; // No active tab
  };

  const activeIndex = getActiveIndex();

  const handleMenuItemClick = () => {
    setIsPopoverOpen(false);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 pb-4">
      <div className="flex items-end justify-between px-6 py-2">
        <div className="relative flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-neutral-200/50 px-2 py-2 dark:bg-neutral-900/90 dark:border-neutral-700/50">
          {activeIndex >= 0 && (
            <div
              className="absolute top-2 bottom-2 w-16 bg-emerald-500/20 rounded-full transition-transform duration-300 ease-out dark:bg-emerald-400/20"
              style={{
                transform: `translateX(${activeIndex * 64}px)`,
              }}
            />
          )}

          {/* HOME */}
          <NavItem
            href="/home"
            label="HOME"
            active={isActive("/home")}
            icon={<Home className="h-5 w-5" />}
          />

          {/* PROGRESS */}
          <NavItem
            href="/progress"
            label="PROGRESS"
            active={isActive("/progress")}
            icon={<TrendingUp className="h-5 w-5" />}
          />

          {/* PROFILE */}
          <NavItem
            href="/profile"
            label="PROFILE"
            active={isActive("/profile")}
            icon={<User className="h-5 w-5" />}
          />
        </div>

        {/* LOG - Floating Action Button */}
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-xl transition-all duration-300 hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 hover:shadow-2xl active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-transparent"
              aria-label="Quick Actions"
            >
              <PlusIcon className="h-6 w-6" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 mx-2" align="center" side="top">
            <div className="flex flex-col gap-1">
              <Link href="/track/camera" onClick={handleMenuItemClick}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Scan className="h-5 w-5" />
                  <span>Scan</span>
                </Button>
              </Link>
              <Link href="/track/manual" onClick={handleMenuItemClick}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                >
                  <Edit2 className="h-5 w-5" />
                  <span>Log</span>
                </Button>
              </Link>
              <Link href="/recipes" onClick={handleMenuItemClick}>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-12"
                >
                  <ChefHat className="h-5 w-5" />
                  <span>Recipes</span>
                </Button>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative z-10 flex flex-col min-w-[64px] items-center justify-center p-2 rounded-full transition-all duration-200 ${
        active
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      }`}
      aria-label={label}
    >
      <div className="mb-1">{icon}</div>
    </Link>
  );
}

export function useNavBar(hiddenRoutes: string[] = []) {
  const pathname = usePathname() || "/";

  const isHiddenRoute = hiddenRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return {
    isVisible: !isHiddenRoute,
    isHiddenRoute,
  };
}
