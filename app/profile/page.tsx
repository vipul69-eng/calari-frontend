/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user-store"
import { useUpsertUser } from "@/hooks/use-user"
import { useMacroSuggestion } from "@/hooks/use-food"
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
  height: string // Added height field
  weight: string // Added weight field
  profileText: string
  selectedChoices: string[]
  customText: string
  macros: Macros
}

interface Profile {
  name: string
  age: number
  height?: number // Added height to profile interface
  weight?: number // Added weight to profile interface
  profileText?: string
  macros: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

type Mode = "view" | "edit" | "create"

const PREDEFINED_CHOICES = [
  { id: "vegetarian", label: "Vegetarian", category: "diet" },
  { id: "non-vegetarian", label: "Non-Vegetarian", category: "diet" },
  { id: "eggetarian", label: "Eggetarian", category: "diet" },
  { id: "vegan", label: "Vegan", category: "diet" },
  { id: "keto", label: "Keto", category: "diet" },
  { id: "paleo", label: "Paleo", category: "diet" },
  { id: "sedentary", label: "Sedentary", category: "activity" },
  { id: "lightly-active", label: "Lightly Active", category: "activity" },
  { id: "moderately-active", label: "Moderately Active", category: "activity" },
  { id: "very-active", label: "Very Active", category: "activity" },
  { id: "weight-loss", label: "Weight Loss", category: "goal" },
  { id: "muscle-gain", label: "Muscle Gain", category: "goal" },
  { id: "maintenance", label: "Maintenance", category: "goal" },
]

export default function ProfilePage() {
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const { upsertUser, loading: upserting } = useUpsertUser()
  const {
    getSuggestion,
    loading: suggestingMacros,
    error: suggestionError,
    data: suggestionData,
    reset: resetSuggestion,
  } = useMacroSuggestion()
  const [mode, setMode] = useState<Mode>("view")
  const [saving, setSaving] = useState<boolean>(false)
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    height: "", // Added height to form state
    weight: "", // Added weight to form state
    profileText: "",
    selectedChoices: [],
    customText: "",
    macros: {
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    },
  })

  const plan = user?.plan || "basic"
  const profile = user?.profile as Profile | undefined
  const loading = upserting

  const isEmptyProfile = useMemo(() => {
    if (!profile) return true

    if (Object.keys(profile).length === 0) return true

    if (!profile.name || !profile.age || !profile.macros) return true

    const macros = profile.macros
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs) return true

    return false
  }, [profile])

  useEffect(() => {
    if (isEmptyProfile) {
      setMode("create")
    } else {
      setMode("view")
    }
  }, [isEmptyProfile])

  const isBasic = plan === "basic"
  const isPro = plan === "pro"
  const macrosAreFilled = useMemo(() => {
    const m = form.macros
    const vals = [m.calories, m.protein, m.fat, m.carbs]
    return vals.every((v) => v !== "" && !Number.isNaN(Number(v)))
  }, [form.macros])

  const parseProfileText = useCallback((profileText: string) => {
    const choices: string[] = []
    let remainingText = profileText

    PREDEFINED_CHOICES.forEach((choice) => {
      const regex = new RegExp(`\\b${choice.label.toLowerCase()}\\b`, "i")
      if (regex.test(profileText.toLowerCase())) {
        choices.push(choice.id)
        remainingText = remainingText.replace(regex, "").trim()
      }
    })

    // Clean up extra spaces and commas
    remainingText = remainingText
      .replace(/,\s*,/g, ",")
      .replace(/^,\s*|,\s*$/g, "")
      .trim()

    return { choices, customText: remainingText }
  }, [])

  const combineProfileText = useCallback((choices: string[], customText: string) => {
    const choiceLabels = choices
      .map((choiceId) => PREDEFINED_CHOICES.find((c) => c.id === choiceId)?.label)
      .filter(Boolean)

    const parts = [...choiceLabels, customText].filter((part) => part && part.trim())
    return parts.join(", ")
  }, [])

  const startEdit = useCallback(() => {
    if (profile && !isEmptyProfile) {
      const { choices, customText } = parseProfileText(profile.profileText || "")
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        height: profile.height?.toString() || "", // Added height to edit form
        weight: profile.weight?.toString() || "", // Added weight to edit form
        profileText: profile.profileText || "",
        selectedChoices: choices,
        customText: customText,
        macros: {
          calories: profile.macros?.calories?.toString() || "",
          protein: profile.macros?.protein?.toString() || "",
          fat: profile.macros?.fat?.toString() || "",
          carbs: profile.macros?.carbs?.toString() || "",
        },
      })
    }
    setMode("edit")
  }, [profile, isEmptyProfile, parseProfileText])

  const startCreate = useCallback(() => {
    setForm({
      name: "",
      age: "",
      height: "", // Added height to create form
      weight: "", // Added weight to create form
      profileText: "",
      selectedChoices: [],
      customText: "",
      macros: {
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
      },
    })
    setMode("create")
  }, [])

  useEffect(() => {
    const combinedText = combineProfileText(form.selectedChoices, form.customText)
    if (combinedText !== form.profileText) {
      setForm((f) => ({ ...f, profileText: combinedText }))
    }
  }, [form.selectedChoices, form.customText, combineProfileText])

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
    if (!form.height || Number.isNaN(Number(form.height))) return false
    if (!form.weight || Number.isNaN(Number(form.weight))) return false
    if (!macrosAreFilled) return false
    return true
  }, [form.name, form.age, form.height, form.weight, macrosAreFilled])

  const createProfile = useCallback(async () => {
    if (!validateForm() || !user) return false

    const newProfile: Profile = {
      name: form.name.trim(),
      age: Number(form.age),
      height: form.height ? Number(form.height) : undefined, // Added height to profile creation
      weight: form.weight ? Number(form.weight) : undefined, // Added weight to profile creation
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs),
      },
    }

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: newProfile,
    })

    const updatedUser = {
      ...user,
      profile: newProfile,
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
      height: form.height ? Number(form.height) : undefined, // Added height to profile update
      weight: form.weight ? Number(form.weight) : undefined, // Added weight to profile update
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs),
      },
    }

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: updatedProfile,
    })

    const updatedUser = {
      ...user,
      profile: updatedProfile,
    }
    setUser(updatedUser)

    setMode("view")
    return true
  }, [form, user, validateForm, upsertUser, setUser])

  const handleSuggestMacros = useCallback(async () => {
    if (!form.profileText.trim() || !form.age) {
      toast("Please fill in your age and profile details first")
      return
    }

    const ageNum = Number(form.age)
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      toast("Please enter a valid age")
      return
    }

    try {
      let enhancedContext = form.profileText.trim()
      if (form.height) {
        enhancedContext += `, height: ${form.height}cm`
      }
      if (form.weight) {
        enhancedContext += `, weight: ${form.weight}kg`
      }

      const suggestion = await getSuggestion(enhancedContext, ageNum)
      if (suggestion) {
        setForm((f) => ({
          ...f,
          macros: {
            calories: suggestion.calories.toString(),
            protein: suggestion.protein.toString(),
            fat: suggestion.fat.toString(),
            carbs: suggestion.carbs.toString(),
          },
        }))
        toast("Macro suggestions applied!")
      }
    } catch (error) {
      console.error("Failed to get macro suggestions:", error)
    }
  }, [form.profileText, form.age, form.height, form.weight, getSuggestion])

  const showSuggestButton = useMemo(() => {
    return isPro && (form.selectedChoices.length > 0 || form.customText.length > 20)
  }, [isPro, form.selectedChoices.length, form.customText.length])

  const toggleChoice = useCallback(
    (choiceId: string) => {
      const choice = PREDEFINED_CHOICES.find((c) => c.id === choiceId)
      if (!choice) return

      setForm((f) => {
        let newChoices = [...f.selectedChoices]

        if (choice.category === "diet" || choice.category === "activity") {
          // Single selection for diet and activity - remove other choices in same category
          newChoices = newChoices.filter((id) => {
            const existingChoice = PREDEFINED_CHOICES.find((c) => c.id === id)
            return existingChoice?.category !== choice.category
          })

          // Toggle the clicked choice
          if (!f.selectedChoices.includes(choiceId)) {
            newChoices.push(choiceId)
          }
        } else {
          // Multiple selection for goals
          if (f.selectedChoices.includes(choiceId)) {
            newChoices = newChoices.filter((id) => id !== choiceId)
          } else {
            newChoices.push(choiceId)
          }
        }

        return { ...f, selectedChoices: newChoices }
      })

      if (suggestionData) {
        resetSuggestion()
      }
    },
    [suggestionData, resetSuggestion],
  )

  return (
    <main
      className="min-h-dvh bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div className="mx-auto max-w-md px-4 py-8 sm:max-w-lg sm:px-6">
        <div className="space-y-6">
          {mode === "create" && (
            <header className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Profile</h1>
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold",
                    isPro ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {plan.toUpperCase()} PLAN
                </span>
              </div>
            </header>
          )}

          {mode === "view" && !isEmptyProfile && profile ? (
            <>
              <section aria-label="User header" className="text-center space-y-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight text-foreground">{profile.name}</h1>
                  <div className="mt-4 flex items-center justify-center gap-6 text-muted-foreground">
                    
                  </div>
                  {isPro && (
                    <div className="mt-3 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">PRO MEMBER</span>
                    </div>
                  )}
                </div>
              </section>

              <section aria-label="Daily suggested macro intake">
                <Card className="border-border bg-card shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-center text-xl font-semibold text-card-foreground">
                      Daily Macros
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <MacroCard label="Calories" value={profile.macros.calories} unit="kcal" tone="muted" />
                      <MacroCard label="Protein" value={profile.macros.protein} unit="g" tone="muted" />
                      <MacroCard label="Fat" value={profile.macros.fat} unit="g" tone="muted" />
                      <MacroCard label="Carbs" value={profile.macros.carbs} unit="g" tone="muted" />
                    </div>
                  </CardContent>
                </Card>
              </section>

              {profile.profileText && isPro && (
                <section aria-label="Profile details">
                  <Card className="border-border bg-card shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-card-foreground">Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-card-foreground">{profile.profileText}</p>
                    </CardContent>
                  </Card>
                </section>
              )}

              <div className="pt-4">
                <Button
                  className="h-12 w-full rounded-lg bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  variant="outline"
                  onClick={startEdit}
                >
                  Edit Profile
                </Button>
              </div>
            </>
          ) : null}

          {(mode === "create" || mode === "edit") && (
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl font-semibold text-card-foreground">
                  {mode === "create" ? "Create Profile" : "Edit Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-card-foreground">
                      Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                      className="h-12 rounded-lg border-border bg-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-sm font-medium text-card-foreground">
                        Age *
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
                        className="h-12 rounded-lg border-border bg-input"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-sm font-medium text-card-foreground">
                        Height (cm) *
                      </Label>
                      <Input
                        id="height"
                        inputMode="numeric"
                        type="number"
                        placeholder="Height"
                        value={form.height}
                        onChange={(e) => setForm((f: any) => ({ ...f, height: e.target.value }))}
                        min={50}
                        max={250}
                        className="h-12 rounded-lg border-border bg-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium text-card-foreground">
                      Weight (kg) *
                    </Label>
                    <Input
                      id="weight"
                      inputMode="numeric"
                      type="number"
                      placeholder="Weight"
                      value={form.weight}
                      onChange={(e) => setForm((f: any) => ({ ...f, weight: e.target.value }))}
                      min={20}
                      max={300}
                      className="h-12 rounded-lg border-border bg-input"
                      required
                    />
                  </div>
                </div>

                {isPro ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-card-foreground">Tell us about you</Label>
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        PRO
                      </span>
                    </div>

                    <div className="space-y-4">
                      {["diet", "activity", "goal"].map((category) => {
                        const categoryChoices = PREDEFINED_CHOICES.filter((choice) => choice.category === category)
                        const categoryTitle =
                          category === "diet"
                            ? "Dietary Preferences"
                            : category === "activity"
                              ? "Activity Level"
                              : "Fitness Goals"

                        return (
                          <div key={category} className="space-y-3">
                            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {categoryTitle}{" "}
                              {category !== "goal" && <span className="text-muted-foreground/60">(Select one)</span>}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {categoryChoices.map((choice) => (
                                <Button
                                  key={choice.id}
                                  type="button"
                                  size="sm"
                                  variant={form.selectedChoices.includes(choice.id) ? "default" : "outline"}
                                  className={cn(
                                    "h-9 rounded-full text-sm transition-all",
                                    form.selectedChoices.includes(choice.id)
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                      : "bg-background text-foreground border-border hover:bg-muted",
                                  )}
                                  onClick={() => toggleChoice(choice.id)}
                                >
                                  {choice.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="custom-text"
                        className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                      >
                        Additional Details (Optional)
                      </Label>
                      <Textarea
                        id="custom-text"
                        placeholder="E.g., specific allergies, workout routine, health conditions..."
                        value={form.customText}
                        onChange={(e) => {
                          setForm((f: any) => ({ ...f, customText: e.target.value }))
                          if (suggestionData) {
                            resetSuggestion()
                          }
                        }}
                        className="min-h-[80px] resize-y rounded-lg border-border bg-input"
                      />
                    </div>

                    {showSuggestButton && (
                      <div className="space-y-2">
                        
                        <div className="relative">
                          <Button
                            type="button"
                            size="sm"
                            className="absolute my-2 right-2 top-1/2 -translate-y-1/2 h-8 rounded-md bg-primary text-primary-foreground px-3 hover:bg-primary/90 transition-colors text-xs"
                            onClick={handleSuggestMacros}
                            disabled={suggestingMacros}
                          >
                            {suggestingMacros ? "..." : "Suggest"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {form.selectedChoices.length === 0 && form.customText.length <= 20 && (
                      <p className="text-xs text-center text-muted-foreground">
                        Select preferences or add {20 - form.customText.length} more characters to unlock AI macro
                        suggestions
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      Upgrade to <span className="font-semibold text-primary">PRO</span> to add profile details and get
                      AI macro suggestions
                    </p>
                  </div>
                )}

                

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-card-foreground">Daily Macros *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <MacroInput
                      label="Calories"
                      unit="kcal"
                      value={form.macros.calories}
                      onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, calories: v } }))}
                      tone="muted"
                    />
                    <MacroInput
                      label="Protein"
                      unit="g"
                      value={form.macros.protein}
                      onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, protein: v } }))}
                      tone="muted"
                    />
                    <MacroInput
                      label="Fat"
                      unit="g"
                      value={form.macros.fat}
                      onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, fat: v } }))}
                      tone="muted"
                    />
                    <MacroInput
                      label="Carbs"
                      unit="g"
                      value={form.macros.carbs}
                      onChange={(v) => setForm((f) => ({ ...f, macros: { ...f.macros, carbs: v } }))}
                      tone="muted"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                  {mode === "edit" ? (
                    <>
                      <Button
                        variant="outline"
                        className="h-12 rounded-lg bg-background text-foreground border-border hover:bg-muted transition-colors sm:w-auto"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors sm:w-auto"
                        disabled={saving}
                        onClick={async () => {
                          setSaving(true)
                          const ok = await updateProfile()
                          if (ok) {
                            toast("Profile updated")
                          } else {
                            toast("Check inputs")
                          }
                          setSaving(false)
                        }}
                      >
                        {!saving?"Save Changes":"Saving..."}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="h-12 rounded-lg bg-background text-foreground border-border hover:bg-muted transition-colors sm:w-auto"
                        onClick={startCreate}
                      >
                        Reset
                      </Button>
                      <Button
                        className="h-12 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors sm:w-auto"
                        onClick={async () => {
                          const ok = await createProfile()
                          if (ok) {
                            toast("Profile created")
                          } else {
                            toast("Check your inputs")
                          }
                        }}
                      >
                        Create Profile
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  )
}

function MacroInput({
  label,
  unit,
  value,
  onChange,
  tone = "muted",
}: {
  label: string
  unit: string
  value: string
  onChange: (next: string) => void
  tone?: "primary" | "secondary" | "accent" | "muted"
}) {
  const toneStyles = {
    primary: "border-primary/20 bg-primary/5",
    secondary: "border-secondary/20 bg-secondary/5",
    accent: "border-accent/20 bg-accent/5",
    muted: "border-border bg-muted/30",
  }

  const chipStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
    muted: "bg-muted text-muted-foreground",
  }

  return (
    <div className={cn("rounded-lg border p-3", toneStyles[tone])}>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-card-foreground">{label}</div>
        <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", chipStyles[tone])}>{unit}</span>
      </div>
      <Input
        inputMode="numeric"
        type="number"
        min={0}
        className="border-none bg-transparent p-0 text-xl font-semibold focus-visible:ring-0 focus-visible:ring-offset-0"
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
  tone = "muted",
}: {
  label: string
  value: number
  unit: string
  tone?: "primary" | "secondary" | "accent" | "muted"
}) {
  const toneStyles = {
    primary: {
      container: "border-primary/20 bg-primary/5",
      text: "text-primary",
      chip: "bg-primary/10 text-primary",
    },
    secondary: {
      container: "border-secondary/20 bg-secondary/5",
      text: "text-secondary",
      chip: "bg-secondary/10 text-secondary",
    },
    accent: {
      container: "border-accent/20 bg-accent/5",
      text: "text-accent",
      chip: "bg-accent/10 text-accent",
    },
    muted: {
      container: "border-border bg-muted/30",
      text: "text-card-foreground",
      chip: "bg-muted text-muted-foreground",
    },
  }

  const styles = toneStyles[tone]

  return (
    <div className={cn("rounded-lg border p-4", styles.container)}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className={cn("rounded-full px-2 py-1 text-xs font-semibold", styles.chip)}>{unit}</div>
      </div>
      <div className={cn("text-3xl font-bold tabular-nums", styles.text)}>{value}</div>
    </div>
  )
}
