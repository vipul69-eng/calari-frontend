"use client"
import Link from "next/link"
import type React from "react"
import { useEffect, useState } from "react"

import { usePathname } from "next/navigation"
import { Camera, Settings, User, Utensils, X, ChevronLeft, ChevronRight } from "lucide-react"

const walkthroughSteps = [
  {
    id: "home",
    title: "Home",
    description: "See all the tracked food here and create custom recepies.",
    position: "top",
  },
  {
    id: "track",
    title: "Scan",
    description: "Use your camera or text to scan food items and get instant nutritional analysis.",
    position: "top",
  },
  {
    id: "profile",
    title: "Profile",
    description: "Manage your personal information, dietary preferences, and meal history.",
    position: "top",
  },
  {
    id: "settings",
    title: "Settings",
    description: "Customize your app experience and manage your account settings.",
    position: "top",
  },
]

export default function AppNav({ hiddenRoutes = ["track"] }: { hiddenRoutes?: string[] }) {
  const pathname = usePathname() || "/"
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem("navbar-walkthrough-seen")
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true)
    }
  }, [])

  const nextStep = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeWalkthrough()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const completeWalkthrough = () => {
    setShowWalkthrough(false)
    localStorage.setItem("navbar-walkthrough-seen", "true")
  }

  // Hide nav on matching routes
  const hidden = hiddenRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))
  if (hidden) return null

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      {showWalkthrough && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <WalkthroughCard
            step={walkthroughSteps[currentStep]}
            currentStep={currentStep}
            totalSteps={walkthroughSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={completeWalkthrough}
          />
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40"
        aria-label="Primary"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto max-w-screen-sm px-4 pb-3">
          <div
            className="mx-auto flex items-center justify-around rounded-full border border-neutral-200 bg-white/95 px-3 py-2 shadow-lg
                          dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/30"
          >
            <NavIcon
              href="/home"
              label="Home"
              active={isActive("/home")}
              id="home"
              highlighted={showWalkthrough && walkthroughSteps[currentStep].id === "home"}
            >
              <Utensils className="h-5 w-5" />
            </NavIcon>
            <NavIcon
              href="/track"
              label="Scan"
              active={isActive("/analysis")}
              id="track"
              highlighted={showWalkthrough && walkthroughSteps[currentStep].id === "track"}
            >
              <Camera className="h-5 w-5" />
            </NavIcon>
            <NavIcon
              href="/profile"
              label="Profile"
              active={isActive("/profile")}
              id="profile"
              highlighted={showWalkthrough && walkthroughSteps[currentStep].id === "profile"}
            >
              <User className="h-5 w-5" />
            </NavIcon>
            <NavIcon
              href="/settings"
              label="Settings"
              active={isActive("/settings")}
              id="settings"
              highlighted={showWalkthrough && walkthroughSteps[currentStep].id === "settings"}
            >
              <Settings className="h-5 w-5" />
            </NavIcon>
          </div>
        </div>
      </nav>
    </>
  )
}

function NavIcon({
  href,
  children,
  label,
  active = false,
  id,
  highlighted = false,
}: {
  href: string
  children: React.ReactNode
  label: string
  active?: boolean
  id?: string
  highlighted?: boolean
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
  )
}

function WalkthroughCard({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
}: {
  step: (typeof walkthroughSteps)[0]
  currentStep: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
}) {
  return (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-80 max-w-[90vw]">
      {/* Pointer arrow */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-neutral-800"></div>

      {/* Card */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              {currentStep + 1} of {totalSteps}
            </span>
          </div>
          <button
            onClick={onSkip}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            aria-label="Skip walkthrough"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{step.title}</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-emerald-500"
                    : index < currentStep
                      ? "bg-emerald-300 dark:bg-emerald-700"
                      : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors"
          >
            {currentStep === totalSteps - 1 ? "Finish" : "Next"}
            {currentStep < totalSteps - 1 && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}
