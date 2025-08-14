/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, Pencil, PlusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user-store"
import { useUpsertUser } from "@/hooks/use-user"
import { toast } from "sonner"

interface Macros {
  calories: string
  protein: string
  fat: string
  carbs: string
}

interface ProfileForm {
  name: string
  age: string
  profileText: string
  macros: Macros
}

interface Profile {
  name: string
  age: number
  profileText?: string
  macros: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

type Mode = "view" | "edit" | "create"

export default function ProfilePage() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const { upsertUser, loading: upserting } = useUpsertUser()
  const [mode, setMode] = useState<Mode>("view")
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    profileText: "",
    macros: {
      calories: "",
      protein: "",
      fat: "",
      carbs: ""
    }
  })

  const plan = user?.plan || "basic"
  const profile = user?.profile as Profile | undefined
  const loading = upserting
  // Check if profile exists and has required fields
  const isEmptyProfile = useMemo(() => {
    if (!profile) return true
    
    // Check if profile is empty object {}
    if (Object.keys(profile).length === 0) return true
    
    // Check if profile lacks essential fields
    if (!profile.name || !profile.age || !profile.macros) return true
    
    // Check if macros are empty
    const macros = profile.macros
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs) return true
    
    return false
  }, [profile])

  // Set initial mode based on profile state
  useEffect(() => {
    if (isEmptyProfile) {
      setMode("create")
    } else {
      setMode("view")
    }
  }, [isEmptyProfile])

  const isBasic = plan === "basic"
  const macrosAreFilled = useMemo(() => {
    const m = form.macros
    const vals = [m.calories, m.protein, m.fat, m.carbs]
    return vals.every((v) => v !== "" && !Number.isNaN(Number(v)))
  }, [form.macros])

  const startEdit = useCallback(() => {
    if (profile && !isEmptyProfile) {
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        profileText: profile.profileText || "",
        macros: {
          calories: profile.macros?.calories?.toString() || "",
          protein: profile.macros?.protein?.toString() || "",
          fat: profile.macros?.fat?.toString() || "",
          carbs: profile.macros?.carbs?.toString() || ""
        }
      })
    }
    setMode("edit")
  }, [profile, isEmptyProfile])

  const startCreate = useCallback(() => {
    setForm({
      name: "",
      age: "",
      profileText: "",
      macros: {
        calories: "",
        protein: "",
        fat: "",
        carbs: ""
      }
    })
    setMode("create")
  }, [])

  const cancelEdit = useCallback(() => {
    if (isEmptyProfile) {
      setMode("create")
    } else {
      setMode("view")
    }
  }, [isEmptyProfile])

  const validateForm = useCallback(() => {
    if (!form.name.trim()) return false
    if (!form.age || Number.isNaN(Number(form.age))) return false
    if (!macrosAreFilled) return false
    return true
  }, [form.name, form.age, macrosAreFilled])
  const createProfile = useCallback(async () => {
    if (!validateForm() || !user) return false

    const newProfile: Profile = {
      name: form.name.trim(),
      age: Number(form.age),
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs)
      }
    }

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: newProfile
    })

    // Update the store immediately with new profile
    const updatedUser = {
      ...user,
      profile: newProfile
    }
    setUser(updatedUser)

    setMode("view")
    return true
  }, [form, user, validateForm, upsertUser, setUser])

  const updateProfile = useCallback(async () => {
    if (!validateForm() || !user) return false

    const updatedProfile: Profile = {
      name: form.name.trim(),
      age: Number(form.age),
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs)
      }
    }

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: updatedProfile
    })

    // Update the store immediately with updated profile
    const updatedUser = {
      ...user,
      profile: updatedProfile
    }
    setUser(updatedUser)

    setMode("view")
    return true
  }, [form, user, validateForm, upsertUser, setUser])




  if (loading) {
    return (
      <main
        className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
      >
        <div className="mx-auto max-w-screen-sm px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <Card className="animate-pulse border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900/60">
              <CardHeader className="pb-3">
                <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-24 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="animate-pulse border-neutral-200 dark:border-neutral-800 dark:bg-neutral-900/60">
              <CardHeader className="pb-3">
                <div className="h-6 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
              </CardHeader>
              <CardContent>
                <div className="h-20 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              </CardContent>
            </Card>
            <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-dvh bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto max-w-screen-sm px-4 py-8 space-y-6">
        {/* Create mode header */}
        {mode === "create" && (
          <header className="flex flex-col items-start justify-between pb-4 border-b border-neutral-200 dark:border-neutral-800">
            <h1 className="text-3xl font-bold tracking-tight">Create your profile</h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Plan: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{plan.toUpperCase()}</span>
            </p>
          </header>
        )}

        {/* View mode - only show if profile exists and is not empty */}
        {mode === "view" && !isEmptyProfile && profile ? (
          <>
            <section aria-label="User header" className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {profile.name}
                </h1>
                <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">Age:</span> {profile.age}
                </p>
              </div>
            </section>

            <section aria-label="Daily suggested macro intake">
              <Card className="border-neutral-200 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                    Daily Macros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MacroCard label="Cal" value={profile.macros.calories} unit="kcal" />
                    <MacroCard label="Protein" value={profile.macros.protein} unit="g" />
                    <MacroCard label="Fat" value={profile.macros.fat} unit="g" />
                    <MacroCard label="Carbs" value={profile.macros.carbs} unit="g" />
                  </div>
                </CardContent>
              </Card>
            </section>

            {profile.profileText && plan !== "basic" ? (
              <section aria-label="Profile details">
                <Card className="border-neutral-200 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/60">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                      Profile Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base text-neutral-700 dark:text-neutral-300">{profile.profileText}</p>
                  </CardContent>
                </Card>
              </section>
            ) : null}

            <div className="pt-4">
              <Button
                className="w-full rounded-xl bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                variant="outline"
                onClick={startEdit}
              >
                <Pencil className="mr-2 h-4 w-4" /> Edit profile
              </Button>
            </div>
          </>
        ):null}

        {/* Create or Edit mode */}
        {(mode === "create" || mode === "edit") && (
          <Card className="border-neutral-200 shadow-lg dark:border-neutral-800 dark:bg-neutral-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
                {mode === "create" ? "Create Profile" : "Edit Profile"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Age
                  </Label>
                  <Input
                    id="age"
                    inputMode="numeric"
                    type="number"
                    placeholder="Age"
                    value={form.age}
                    onChange={(e) => setForm((f: any) => ({ ...f, age: e.target.value }))}
                    min={5}
                    max={120}
                    className="border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                </div>
              </div>

              {!isBasic ? (
                <div className="space-y-2">
                  <Label
                    htmlFor="profile-text"
                    className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Tell us about you
                  </Label>
                  <Textarea
                    id="profile-text"
                    placeholder="E.g., vegetarian, running 3x/week, focusing on strength..."
                    value={form.profileText}
                    onChange={(e) => setForm((f: any) => ({ ...f, profileText: e.target.value }))}
                    className="min-h-[120px] resize-y border-neutral-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                  />
                  {/* <div className="flex items-center justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-lg bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      onClick={suggestMacros}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Suggest macros
                    </Button>
                  </div> */}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Daily Macros</Label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <MacroInput
                    label="Calories"
                    unit="kcal"
                    value={form.macros.calories}
                    onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, calories: v } }))}
                  />
                  <MacroInput
                    label="Protein"
                    unit="g"
                    value={form.macros.protein}
                    onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, protein: v } }))}
                  />
                  <MacroInput
                    label="Fat"
                    unit="g"
                    value={form.macros.fat}
                    onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, fat: v } }))}
                  />
                  <MacroInput
                    label="Carbs"
                    unit="g"
                    value={form.macros.carbs}
                    onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, carbs: v } }))}
                  />
                </div>
                {!isBasic && !macrosAreFilled ? (
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-2">
                    Tip: Use &quot;Suggest macros&quot; to prefill based on your profile.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                {mode === "edit" ? (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                      onClick={async () => {
                        const ok = await updateProfile()
                        if (ok) {
                          toast("Profile updated")
                        } else {
                          toast("Check inputs")
                        }
                      }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Save changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-xl bg-transparent text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                      onClick={startCreate}
                    >
                      Reset
                    </Button>
                    <Button
                      className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                      onClick={async () => {
                        const ok = await createProfile()
                        if (ok) {
                          toast("Profile created")
                        } else {
                          toast("Check your inputs")
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create profile
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

/* ————— Subcomponents ————— */
function MacroInput({
  label,
  unit,
  value,
  onChange,
}: {
  label: string
  unit: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
          {unit}
        </span>
      </div>
      <Input
        inputMode="numeric"
        type="number"
        min={0}
        className="text-lg font-semibold border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:bg-transparent px-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
    </div>
  )
}

function MacroCard({
  label,
  value,
  unit,
  tone = "neutral",
}: {
  label: string
  value: number
  unit: string
  tone?: "neutral" | "amber" | "rose" | "emerald" | "sky"
}) {
  const map = {
    neutral: {
      ring: "border-neutral-200 dark:border-neutral-800",
      bg: "bg-white/90 dark:bg-neutral-900/60",
      sub: "text-neutral-500 dark:text-neutral-400",
      text: "text-neutral-900 dark:text-neutral-100",
      chip: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    },
    amber: {
      ring: "border-amber-200/80 dark:border-amber-900/50",
      bg: "bg-amber-50/70 dark:bg-amber-950/30",
      sub: "text-amber-700/80 dark:text-amber-300/90",
      text: "text-amber-900 dark:text-amber-100",
      chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
    },
    rose: {
      ring: "border-rose-200/80 dark:border-rose-900/50",
      bg: "bg-rose-50/70 dark:bg-rose-950/30",
      sub: "text-rose-700/80 dark:text-rose-300/90",
      text: "text-rose-900 dark:text-rose-100",
      chip: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
    },
    emerald: {
      ring: "border-emerald-200/80 dark:border-emerald-900/50",
      bg: "bg-emerald-50/70 dark:bg-emerald-950/30",
      sub: "text-emerald-700/80 dark:text-emerald-300/90",
      text: "text-emerald-900 dark:text-emerald-100",
      chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    },
    sky: {
      ring: "border-sky-200/80 dark:border-sky-900/50",
      bg: "bg-sky-50/70 dark:bg-sky-950/30",
      sub: "text-sky-700/80 dark:text-sky-300/90",
      text: "text-sky-900 dark:text-sky-100",
      chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
    },
  }[tone]
  
  return (
    <div className={cn("rounded-xl border p-4 shadow-md", map.ring, map.bg)}>
      <div className="flex items-center justify-between">
        <div className={cn("text-sm font-medium", map.sub)}>{label}</div>
        <div className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", map.chip)}>{unit}</div>
      </div>
      <div className={cn("mt-2 text-3xl font-bold tabular-nums", map.text)}>{value}</div>
    </div>
  )
}
