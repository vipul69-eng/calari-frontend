"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import {
  Bell,
  Check,
  CreditCard,
  Crown,
  DollarSign,
  LogOut,
  Moon,
  Music2,
  Receipt,
  Ruler,
  Shield,
  Sparkles,
  Sun,
  User,
  Wallet,
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
import { useUserStore } from "@/store/user-store"
import { useUpsertUser } from "@/hooks/use-user"

type Plan = "basic" | "pro"
type Units = "metric" | "imperial"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, systemTheme } = useTheme()
  const { signOut } = useAuth()

  
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const clearUser = useUserStore((state) => state.clearUser)
  const { upsertUser } = useUpsertUser()

  const [notifications, setNotifications] = useState(true)
  const [units, setUnits] = useState<Units>("metric")

  const plan = user?.plan || "basic"
const onProClicked=()=>{
    const url = "https://test.checkout.dodopayments.com/buy/pdt_vmZWtlgMx8N9tTi5ClSqb?quantity=1&redirect_url=https://b9be63be7af7.ngrok-free.app%2Fpayments";
    localStorage.setItem("dodo-user-calari",user?.id as string)
    window.open(url,"_blank", "noopener,noreferrer");
  }
  const themeLabel = useMemo(() => {
    if (theme === "system") {
      return `System (${systemTheme ?? "auto"})`
    }
    return theme === "dark" ? "Dark" : "Light"
  }, [theme, systemTheme])

  useEffect(() => {
    try {
      const n = localStorage.getItem("calari:notifications")
      const u = localStorage.getItem("calari:units")
      if (n !== null) setNotifications(n === "1")
      if (u === "metric" || u === "imperial") setUnits(u)
    } catch {}
  }, [])

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

  function haptic(ms = 12) {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(ms)
    } catch {}
  }

  async function onLogout() {
    haptic(16)
    try {
      await signOut()
      clearUser()
      sessionStorage.clear()
    } catch {}
    router.push("/")
  }

  async function onSelectPlan(nextPlan: Plan) {
    haptic(12)

    if (!user) return

    try {
      await upsertUser({
        email: user.email,
        plan: nextPlan,
        profile: user.profile || {},
      })

      const updatedUser = {
        ...user,
        plan: nextPlan,
      }
      setUser(updatedUser)
    } catch {}
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 onClick={()=>{
            router.push("/payments")
          }} className="text-3xl font-heading text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-heading">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
              <div>
                <p className="font-medium text-foreground">{user?.email || "Not signed in"}</p>
                <p className="text-sm text-muted-foreground">Account email</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary capitalize">{plan} Plan</p>
                <p className="text-xs text-muted-foreground">Current subscription</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Sun className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-heading">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">Theme</Label>
              <Select value={theme ?? "system"} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder={themeLabel} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
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
              <p className="text-xs text-muted-foreground">
                Choose how Calari looks. System follows your device setting.
              </p>
            </div>
          </CardContent>
        </Card>



        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-heading">Payment & Billing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.plan=="basic" &&<SettingItem
              icon={<DollarSign className="h-5 w-5 text-primary" />}
              title="Get Calari Pro"
              subtitle="Get access to latest features"
              right={
                <Button onClick={onProClicked} variant="outline" size="sm" className="text-xs bg-transparent">
                  Go Pro
                </Button>
              }
            />}
            <SettingItem
              icon={<CreditCard className="h-5 w-5 text-primary" />}
              title="Plan Details"
              subtitle="All the details related to your plan."
              right={
                <Button variant="outline" size="sm" className="text-xs bg-transparent">
                  View
                </Button>
              }
            />
            
          </CardContent>
        </Card>

       

        {/* Subscription Plans */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-heading">Subscription Plans</CardTitle>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Cancel anytime
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlanOption
              icon={<Music2 className="h-5 w-5" />}
              title="Basic"
              price="0 USD"
              cadence=""
              features={["3 tracks per day"]}
              selected={plan === "basic"}
            />
            <PlanOption
              icon={<Sparkles className="h-5 w-5" />}
              title="Pro"
              price="₹199"
              cadence="/month"
              features={["29 tracks daily", "Profile-based recommendations","All future pro features"]}
              selected={plan === "pro"}
              accent
              badge="Recommended"
            />
            
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <LogOut className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg font-heading">Account Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-popover border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onLogout}>Sign Out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2 text-center">This won&apos;t delete your account.</p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-8">
          {"Calari v0.1.0 • © "}
          {new Date().getFullYear()}
        </div>
      </div>
    </main>
  )
}

function SettingItem(props: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  right?: React.ReactNode
}) {
  const { icon, title, subtitle, right } = props
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
      <div className="flex min-w-0 items-center gap-3">
        {icon && <div className="rounded-lg bg-primary/10 p-2">{icon}</div>}
        <div className="min-w-0">
          <div className="font-medium text-foreground">{title}</div>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="ml-4">{right}</div>}
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
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs">
      <button
        type="button"
        onClick={() => onChange("metric")}
        className={cn(
          "rounded-md px-3 py-1.5 transition-colors font-medium",
          value === "metric"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        )}
      >
        Metric
      </button>
      <button
        type="button"
        onClick={() => onChange("imperial")}
        className={cn(
          "rounded-md px-3 py-1.5 transition-colors font-medium",
          value === "imperial"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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
}) {
  const { icon, title, price, cadence, features, selected, accent, badge, onSelect } = props

  return (
    <div
      className={cn(
        "rounded-lg p-4 border transition-all hover:shadow-md",
        "bg-background",
        selected ? "border-primary shadow-sm ring-1 ring-primary/20" : accent ? "border-primary/30" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <div className="font-semibold text-foreground">{title}</div>
              {badge && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{badge}</span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-lg font-semibold text-foreground">{price}</span>
              {cadence && <span className="text-xs ml-1">{cadence}</span>}
            </div>
          </div>
        </div>
        {selected && <Button
          size="sm"
          className={cn(selected ? "bg-primary text-primary-foreground" : "")}
          variant={selected ? "default" : "outline"}
          onClick={onSelect}
        >
          Current
        </Button>}
      </div>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
