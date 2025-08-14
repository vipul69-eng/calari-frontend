"use client"
import Link from "next/link"
import type React from "react"

import { usePathname } from "next/navigation"
import { Camera, Settings, User, Utensils } from "lucide-react"

export default function AppNav({ hiddenRoutes = ["track"] }: { hiddenRoutes?: string[] }) {
  const pathname = usePathname() || "/"

  // Hide nav on matching routes
  const hidden = hiddenRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  if (hidden) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40"
      aria-label="Primary"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto max-w-screen-sm px-4 pb-3">
        <div
          className="mx-auto flex items-center justify-around rounded-full border border-neutral-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur
                        dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/30"
        >
          <NavIcon href="/home" label="Home" active={isActive("/home")}>
            <Utensils className="h-5 w-5" />
          </NavIcon>
          <NavIcon href="/track" label="Scan" active={isActive("/analysis")}>
            <Camera className="h-5 w-5" />
          </NavIcon>
          <NavIcon href="/profile" label="Profile" active={isActive("/profile")}>
            <User className="h-5 w-5" />
          </NavIcon>
          <NavIcon href="/settings" label="Settings" active={isActive("/settings")}>
            <Settings className="h-5 w-5" />
          </NavIcon>
        </div>
      </div>
    </nav>
  )
}

function NavIcon({
  href,
  children,
  label,
  active = false,
}: {
  href: string
  children: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex flex-col items-center justify-center rounded-xl px-3 py-1.5 text-[11px] 
      ${
        active
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100"
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900`}
    >
      {children}
      <span className="mt-0.5">{label}</span>
    </Link>
  )
}
