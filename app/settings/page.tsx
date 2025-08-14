"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  Bell,
  Check,
  Coins,
  Crown,
  LogOut,
  Moon,
  Music2,
  Ruler,
  Sparkles,
  Sun,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@clerk/nextjs"
import { useUserStore } from "@/store/user-store" // ✅ Fixed import path
import { useUpsertUser } from "@/hooks/use-user"

type Plan = "basic" | "pro" | "creator"
type Units = "metric" | "imperial"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, systemTheme } = useTheme()
  const { signOut } = useAuth()
  
  // ✅ Get user data from Zustand store
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const { upsertUser } = useUpsertUser()

  const [notifications, setNotifications] = useState(true)
  const [units, setUnits] = useState<Units>("metric")

  // ✅ Get plan from user store, not localStorage
  const plan = user?.plan || "basic"

  // Nicer label on theme
  const themeLabel = useMemo(() => {
    if (theme === "system") {
      return `System (${systemTheme ?? "auto"})`
    }
    return theme === "dark" ? "Dark" : "Light"
  }, [theme, systemTheme])

  // Hydrate preferences from localStorage (only for UI preferences, not user data)
  useEffect(() => {
    try {
      const n = localStorage.getItem("calari:notifications")
      const u = localStorage.getItem("calari:units")
      if (n !== null) setNotifications(n === "1")
      if (u === "metric" || u === "imperial") setUnits(u)
    } catch {}
  }, [])

  // Persist UI preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("calari:notifications", notifications ? "1" : "0")
    } catch {}
  }, [notifications])

  useEffect(() => {
    try {
      localStorage.setItem("calari:units", units)
    } catch {}
  }, [units])

  // Small haptic feedback helper
  function haptic(ms = 12) {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(ms)
    } catch {}
  }

  async function onLogout() {
    haptic(16)
    try {
      await signOut()
      clearUser() // ✅ This is correct
      sessionStorage.clear()
    } catch {}
    router.push("/")
  }

  // ✅ Update plan in both store and backend
  async function onSelectPlan(nextPlan: Plan) {
    haptic(12)
    
    if (!user) return

    try {
      // Update backend
      await upsertUser({
        email: user.email,
        plan: nextPlan,
        profile: user.profile || {}
      })

      // Update store immediately
      const updatedUser = {
        ...user,
        plan: nextPlan
      }
      setUser(updatedUser)
    } catch {
    }
  }

  return (
    <main
      className="min-h-dvh bg-white text-neutral-900 antialiased dark:bg-black dark:text-neutral-50"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto max-w-screen-sm px-4 py-6 space-y-6">
        {/* Appearance */}
        <Card className="rounded-2xl border-neutral-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-sm text-neutral-700 dark:text-neutral-300">Theme</Label>
              <Select value={theme ?? "system"} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                <SelectTrigger className="w-full rounded-xl dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100">
                  <SelectValue placeholder={themeLabel} />
                </SelectTrigger>
                <SelectContent className="rounded-xl dark:border-neutral-800 dark:bg-neutral-900">
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Light
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Dark
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Choose how Calari looks. System follows your device setting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="rounded-2xl border-neutral-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ListItem
              icon={<Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
              title="Notifications"
              subtitle="Reminders and updates"
              right={
                <Switch
                  checked={notifications}
                  onCheckedChange={(v) => setNotifications(Boolean(v))}
                  aria-label="Notifications"
                />
              }
            />
            <ListItem
              icon={<Ruler className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
              title="Units"
              subtitle="Measurement preference"
              right={
                <UnitsPill
                  value={units}
                  onChange={(val) => {
                    haptic(8)
                    setUnits(val)
                  }}
                />
              }
            />
          </CardContent>
        </Card>

        {/* Plans */}
        <Card className="rounded-2xl border-neutral-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Plans</CardTitle>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                Cancel anytime
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <PlanOption
              icon={<Music2 className="h-5 w-5" aria-hidden="true" />}
              title="Basic"
              price="0 USD"
              cadence=""
              features={["3 tracks per day"]}
              selected={plan === "basic"}
              onSelect={() => onSelectPlan("basic")}
            />
            <PlanOption
              icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
              title="Pro"
              price="₹99"
              cadence="/month"
              features={["29 tracks daily", "Profile-based recommendations"]}
              selected={plan === "pro"}
              accent
              badge="Recommended"
              onSelect={() => onSelectPlan("pro")}
            />
            <PlanOption
              icon={<Crown className="h-5 w-5" aria-hidden="true" />}
              title="Creator"
              price="₹199"
              cadence="/month"
              features={["29 tracks daily", "Profile-based recommendations", "Recipe uploading", "Monetization"]}
              selected={plan === "creator"}
              onSelect={() => onSelectPlan("creator")}
              extraIcon={<Coins className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
            />
          </CardContent>
        </Card>

        {/* Account */}
        <Card className="rounded-2xl border-neutral-200 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/60">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full rounded-xl">
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Log out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                  <AlertDialogDescription>You will need to sign in again to access your account.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel> No </AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout}> Yes </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">This won&apos;t delete your account.</p>
          </CardContent>
        </Card>

        {/* About */}
        <div className="pb-20 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {"Calari v0.1.0 • © "}
          {new Date().getFullYear()}
        </div>
      </div>
    </main>
  )
}

// Rest of your subcomponents remain the same...
function ListItem(props: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  const { icon, title, subtitle, right } = props
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-900/80">
      <div className="flex min-w-0 items-center gap-3">
        {icon ? (
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-900/40">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{title}</div>
          {subtitle ? <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p> : null}
        </div>
      </div>
      {right ? <div className="pl-3">{right}</div> : null}
    </div>
  )
}

function UnitsPill(props: {
  value?: Units
  onChange?: (value: Units) => void
}) {
  const value = props.value ?? "metric"
  const onChange = props.onChange ?? (() => {})
  return (
    <div
      role="tablist"
      aria-label="Unit preference"
      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-xs shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "metric"}
        onClick={() => onChange("metric")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          value === "metric"
            ? "bg-emerald-600 text-white"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
        )}
      >
        Metric
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "imperial"}
        onClick={() => onChange("imperial")}
        className={cn(
          "rounded-md px-2.5 py-1.5 transition-colors",
          value === "imperial"
            ? "bg-emerald-600 text-white"
            : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
        )}
      >
        Imperial
      </button>
    </div>
  )
}

function PlanOption(props: {
  icon: React.ReactNode
  title: string
  price: string
  cadence?: string
  features: string[]
  selected?: boolean
  accent?: boolean
  badge?: string
  onSelect?: () => void
  extraIcon?: React.ReactNode
}) {
  const { icon, title, price, cadence, features, selected, accent, badge, onSelect, extraIcon } = props

  return (
    <div
      className={cn(
        "rounded-xl p-3 shadow-sm ring-1",
        "bg-white dark:bg-neutral-900",
        selected
          ? "ring-emerald-500/50"
          : accent
            ? "ring-emerald-200/60 dark:ring-emerald-900/60"
            : "ring-neutral-200 dark:ring-neutral-800",
      )}
      role="group"
      aria-label={`${title} plan`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-900/40">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold">{title}</div>
              {badge ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
                  {badge}
                </span>
              ) : null}
            </div>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{price}</span>{" "}
              <span className="text-xs">{cadence}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className={cn("rounded-lg", selected ? "bg-emerald-600 text-white hover:bg-emerald-600" : "")}
          variant={selected ? "default" : "outline"}
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={selected ? `${title} selected` : `Choose ${title}`}
        >
          {selected ? "Current" : "Choose"}
        </Button>
      </div>

      <ul className="mt-3 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span className="text-sm text-neutral-700 dark:text-neutral-300">{f}</span>
          </li>
        ))}
      </ul>

      {extraIcon ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          {extraIcon}
          <span>{"Creator perks included"}</span>
        </div>
      ) : null}
    </div>
  )
}
