/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useUpsertUser } from "@/hooks/use-user";
import { useMacroSuggestion } from "@/hooks/use-food";
import { toast } from "sonner";
import {
  User,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Sparkles,
  Settings,
  Drumstick,
  Edit2,
  EggFried,
  Loader2,
} from "lucide-react";
import Friends from "@/components/friends";
import { useRouter } from "next/navigation";
import { useNavBar } from "@/components/nav/nav-bar";
import { useCurrentDayNutrition, useUserStore } from "@/store";

interface Macros {
  calories: string;
  protein: string;
  fat: string;
  carbs: string;
}

interface ProfileForm {
  name: string;
  age: string;
  height: string;
  weight: string;
  profileText: string;
  selectedChoices: string[];
  customText: string;
  macros: Macros;
}

interface Profile {
  name: string;
  age: number;
  height?: number;
  weight?: number;
  profileText?: string;
  macros: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

type Mode = "view" | "edit" | "create";
type Step = "personal" | "preferences" | "macros" | "review";

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
];

const STEPS: Array<{
  id: Step;
  title: string;
  icon: any;
  description: string;
}> = [
  {
    id: "personal",
    title: "Personal Info",
    icon: User,
    description: "Basic information about you",
  },
  {
    id: "preferences",
    title: "Preferences",
    icon: Drumstick,
    description: "Diet and lifestyle choices",
  },
  {
    id: "macros",
    title: "Macros",
    icon: Calculator,
    description: "Daily nutrition targets",
  },
];

function MacroInput({
  label,
  unit,
  value,
  onChange,
  tone = "muted",
  placeholder = "0",
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (next: string) => void;
  tone?: "primary" | "secondary" | "accent" | "muted";
  placeholder?: string;
}) {
  const toneStyles = {
    primary:
      "border-primary/20 bg-primary/5 focus-within:border-primary/40 focus-within:shadow-sm focus-within:shadow-primary/10",
    secondary:
      "border-secondary/20 bg-secondary/5 focus-within:border-secondary/40 focus-within:shadow-sm focus-within:shadow-secondary/10",
    accent:
      "border-accent/20 bg-accent/5 focus-within:border-accent/40 focus-within:shadow-sm focus-within:shadow-accent/10",
    muted:
      "border-border/30 bg-card focus-within:border-border/60 focus-within:shadow-sm focus-within:shadow-black/5",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all duration-300 shadow-sm hover:shadow-md",
        toneStyles[tone],
      )}
    >
      <div className="mb-3">
        <div className="text-sm font-semibold text-foreground/90 tracking-tight">
          {label}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Input
          inputMode="numeric"
          type="number"
          min={0}
          className="border-none bg-none p-2 text-2xl font-light focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40 flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <span className="text-sm font-medium text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-lg">
          {unit}
        </span>
      </div>
    </div>
  );
}

function MacroCard({
  label,
  value,
  unit,
  tone = "muted",
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "primary" | "secondary" | "accent" | "muted";
}) {
  const toneStyles = {
    primary: {
      container:
        "border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5",
      text: "text-primary",
      chip: "bg-primary/15 text-primary border-primary/20",
    },
    secondary: {
      container:
        "border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5",
      text: "text-secondary",
      chip: "bg-secondary/15 text-secondary border-secondary/20",
    },
    accent: {
      container:
        "border-accent/30 bg-gradient-to-br from-accent/10 to-accent/5",
      text: "text-accent",
      chip: "bg-accent/15 text-accent border-accent/20",
    },
    muted: {
      container: "border-border bg-gradient-to-br from-muted/50 to-muted/20",
      text: "text-foreground",
      chip: "bg-muted text-muted-foreground border-border",
    },
  };

  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "rounded-lg border p-2 transition-all duration-200",
        styles.container,
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-medium",
            styles.chip,
          )}
        >
          {unit}
        </div>
      </div>
      <div className={cn("text-xl font-bold tabular-nums", styles.text)}>
        {value}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const { upsertUser, loading: upserting } = useUpsertUser();
  const { isVisible } = useNavBar();
  const isProfileComplete =
    user?.profile?.name && user?.profile?.age && user?.profile?.macros;
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    setLoading(true);
    router.push("/profile/recipes");
  };
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [loading]);
  const {
    getSuggestion,
    loading: suggestingMacros,
    error: suggestionError,
    data: suggestionData,
    reset: resetSuggestion,
  } = useMacroSuggestion();
  const [mode, setMode] = useState<Mode>("view");
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const [saving, setSaving] = useState<boolean>(false);
  const currentDayNutrition = useCurrentDayNutrition();

  const [isNavigatingForward, setIsNavigatingForward] =
    useState<boolean>(false);
  const [showFriendsFullPage, setShowFriendsFullPage] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    age: "",
    height: "",
    weight: "",
    profileText: "",
    selectedChoices: [],
    customText: "",
    macros: {
      calories: "",
      protein: "",
      fat: "",
      carbs: "",
    },
  });

  const plan = "pro";
  const profile = user?.profile as Profile | undefined;

  const isEmptyProfile = useMemo(() => {
    if (!profile) return true;
    if (Object.keys(profile).length === 0) return true;
    if (!profile.name || !profile.age || !profile.macros) return true;
    const macros = profile.macros;
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs)
      return true;
    return false;
  }, [profile]);

  useEffect(() => {
    if (isEmptyProfile) {
      setMode("create");
    } else {
      setMode("view");
    }
  }, [isEmptyProfile]);

  const isPro = true;
  const macrosAreFilled = useMemo(() => {
    const m = form.macros;
    const vals = [m.calories, m.protein, m.fat, m.carbs];
    return vals.every((v) => v !== "" && !Number.isNaN(Number(v)));
  }, [form.macros]);

  const isStepValid = useCallback(
    (step: Step) => {
      switch (step) {
        case "personal":
          return (
            form.name.trim() &&
            form.age &&
            !Number.isNaN(Number(form.age)) &&
            form.height &&
            !Number.isNaN(Number(form.height)) &&
            form.weight &&
            !Number.isNaN(Number(form.weight))
          );
        case "preferences":
          return isPro ? true : true; // Preferences are optional for basic users
        case "macros":
          return macrosAreFilled;
        case "review":
          return true;
        default:
          return false;
      }
    },
    [form, isPro, macrosAreFilled],
  );

  const nextStep = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex < STEPS.length - 1 && isStepValid(currentStep)) {
      setIsNavigatingForward(true);
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  }, [currentStep, isStepValid]);

  const prevStep = useCallback(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setIsNavigatingForward(false);
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: Step) => {
    setIsNavigatingForward(false);
    setCurrentStep(step);
  }, []);

  const parseProfileText = useCallback((profileText: string) => {
    const choices: string[] = [];
    let remainingText = profileText;

    PREDEFINED_CHOICES.forEach((choice) => {
      const regex = new RegExp(`\\b${choice.label.toLowerCase()}\\b`, "i");
      if (regex.test(profileText.toLowerCase())) {
        choices.push(choice.id);
        remainingText = remainingText.replace(regex, "").trim();
      }
    });

    remainingText = remainingText
      .replace(/,\s*,/g, ",")
      .replace(/^,\s*|,\s*$/g, "")
      .trim();

    return { choices, customText: remainingText };
  }, []);

  const combineProfileText = useCallback(
    (choices: string[], customText: string) => {
      const choiceLabels = choices
        .map(
          (choiceId) =>
            PREDEFINED_CHOICES.find((c) => c.id === choiceId)?.label,
        )
        .filter(Boolean);

      const parts = [...choiceLabels, customText].filter(
        (part) => part && part.trim(),
      );
      return parts.join(", ");
    },
    [],
  );

  const startEdit = useCallback(() => {
    if (profile && !isEmptyProfile) {
      const { choices, customText } = parseProfileText(
        profile.profileText || "",
      );
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        height: profile.height?.toString() || "",
        weight: profile.weight?.toString() || "",
        profileText: profile.profileText || "",
        selectedChoices: choices,
        customText: customText,
        macros: {
          calories: profile.macros?.calories?.toString() || "",
          protein: profile.macros?.protein?.toString() || "",
          fat: profile.macros?.fat?.toString() || "",
          carbs: profile.macros?.carbs?.toString() || "",
        },
      });
    }
    setMode("edit");
    setCurrentStep("personal");
  }, [profile, isEmptyProfile, parseProfileText]);

  const startCreate = useCallback(() => {
    setForm({
      name: "",
      age: "",
      height: "",
      weight: "",
      profileText: "",
      selectedChoices: [],
      customText: "",
      macros: {
        calories: "",
        protein: "",
        fat: "",
        carbs: "",
      },
    });
    setMode("create");
    setCurrentStep("personal");
  }, []);

  useEffect(() => {
    const combinedText = combineProfileText(
      form.selectedChoices,
      form.customText,
    );
    if (combinedText !== form.profileText) {
      setForm((f) => ({ ...f, profileText: combinedText }));
    }
  }, [form.selectedChoices, form.customText, combineProfileText]);

  const cancelEdit = useCallback(() => {
    if (isEmptyProfile) {
      setMode("create");
      setCurrentStep("personal");
    } else {
      setMode("view");
    }
  }, [isEmptyProfile]);

  const validateForm = useCallback(() => {
    if (!form.name.trim()) return false;
    if (!form.age || Number.isNaN(Number(form.age))) return false;
    if (!form.height || Number.isNaN(Number(form.height))) return false;
    if (!form.weight || Number.isNaN(Number(form.weight))) return false;
    if (!macrosAreFilled) return false;
    return true;
  }, [form.name, form.age, form.height, form.weight, macrosAreFilled]);

  const createProfile = useCallback(async () => {
    if (!validateForm() || !user) return false;

    const newProfile: Profile = {
      name: form.name.trim(),
      age: Number(form.age),
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs),
      },
    };

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: newProfile,
    });

    const updatedUser = {
      ...user,
      profile: newProfile,
    };
    setUser(updatedUser);

    setMode("view");
    return true;
  }, [form, user, validateForm, upsertUser, setUser]);

  const updateProfile = useCallback(async () => {
    if (!validateForm() || !user) return false;

    const updatedProfile: Profile = {
      name: form.name.trim(),
      age: Number(form.age),
      height: form.height ? Number(form.height) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      profileText: form.profileText.trim(),
      macros: {
        calories: Number(form.macros.calories),
        protein: Number(form.macros.protein),
        fat: Number(form.macros.fat),
        carbs: Number(form.macros.carbs),
      },
    };

    await upsertUser({
      email: user.email,
      plan: user.plan,
      profile: updatedProfile,
    });

    const updatedUser = {
      ...user,
      profile: updatedProfile,
    };
    setUser(updatedUser);

    setMode("view");
    return true;
  }, [form, user, validateForm, upsertUser, setUser]);

  const handleSuggestMacros = useCallback(async () => {
    if (!form.profileText.trim() || !form.age) {
      toast("Please fill in your age and profile details first");
      return;
    }

    const ageNum = Number(form.age);
    if (isNaN(ageNum) || ageNum < 5 || ageNum > 120) {
      toast("Please enter a valid age");
      return;
    }

    try {
      let enhancedContext = form.profileText.trim();
      if (form.height) {
        enhancedContext += `, height: ${form.height}cm`;
      }
      if (form.weight) {
        enhancedContext += `, weight: ${form.weight}kg`;
      }

      const suggestion = await getSuggestion(enhancedContext, ageNum);
      if (suggestion) {
        setForm((f) => ({
          ...f,
          macros: {
            calories: suggestion.calories.toString(),
            protein: suggestion.protein.toString(),
            fat: suggestion.fat.toString(),
            carbs: suggestion.carbs.toString(),
          },
        }));
        toast("Macro suggestions applied!");
      }
    } catch (error) {}
  }, [form.profileText, form.age, form.height, form.weight, getSuggestion]);

  const showSuggestButton = useMemo(() => {
    return (
      isPro && (form.selectedChoices.length > 0 || form.customText.length > 20)
    );
  }, [isPro, form.selectedChoices.length, form.customText.length]);

  const toggleChoice = useCallback(
    (choiceId: string) => {
      const choice = PREDEFINED_CHOICES.find((c) => c.id === choiceId);
      if (!choice) return;

      setForm((f) => {
        let newChoices = [...f.selectedChoices];

        if (choice.category === "diet" || choice.category === "activity") {
          newChoices = newChoices.filter((id) => {
            const existingChoice = PREDEFINED_CHOICES.find((c) => c.id === id);
            return existingChoice?.category !== choice.category;
          });

          if (!f.selectedChoices.includes(choiceId)) {
            newChoices.push(choiceId);
          }
        } else {
          if (f.selectedChoices.includes(choiceId)) {
            newChoices = newChoices.filter((id) => id !== choiceId);
          } else {
            newChoices.push(choiceId);
          }
        }

        // Update profile text immediately
        const newProfileText = combineProfileText(newChoices, f.customText);

        return {
          ...f,
          selectedChoices: newChoices,
          profileText: newProfileText,
        };
      });

      if (suggestionData) {
        resetSuggestion();
      }
    },
    [combineProfileText, suggestionData, resetSuggestion],
  );

  useEffect(() => {
    if (
      currentStep === "macros" &&
      isNavigatingForward &&
      isPro &&
      showSuggestButton &&
      isEmptyProfile
    ) {
      handleSuggestMacros();
      setIsNavigatingForward(false); // Reset flag after triggering
    }
  }, [
    currentStep,
    isNavigatingForward,
    isPro,
    showSuggestButton,
    handleSuggestMacros,
  ]);

  const renderStepContent = () => {
    switch (currentStep) {
      case "personal":
        return (
          <div className="space-y-6">
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/30">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-semibold text-foreground/90 tracking-tight"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f: any) => ({ ...f, name: e.target.value }))
                    }
                    className="h-12 rounded-2xl border-border/30 bg-background/50 text-base font-light placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:shadow-primary/10 transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="age"
                    className="text-sm font-semibold text-foreground/90 tracking-tight"
                  >
                    Age
                  </Label>
                  <Input
                    id="age"
                    inputMode="numeric"
                    type="number"
                    placeholder="25"
                    value={form.age}
                    onChange={(e) =>
                      setForm((f: any) => ({ ...f, age: e.target.value }))
                    }
                    min={5}
                    max={120}
                    className="h-12 rounded-2xl border-border/30 bg-background/50 text-base font-light placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:shadow-primary/10 transition-all duration-300"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="height"
                      className="text-sm font-semibold text-foreground/90 tracking-tight"
                    >
                      Height
                    </Label>
                    <div className="relative">
                      <Input
                        id="height"
                        inputMode="numeric"
                        type="number"
                        placeholder="170"
                        value={form.height}
                        onChange={(e) =>
                          setForm((f: any) => ({
                            ...f,
                            height: e.target.value,
                          }))
                        }
                        min={50}
                        max={250}
                        className="h-12 rounded-2xl border-border/30 bg-background/50 text-base font-light placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:shadow-primary/10 transition-all duration-300 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-lg">
                        cm
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="weight"
                      className="text-sm font-semibold text-foreground/90 tracking-tight"
                    >
                      Weight
                    </Label>
                    <div className="relative">
                      <Input
                        id="weight"
                        inputMode="numeric"
                        type="number"
                        placeholder="70"
                        value={form.weight}
                        onChange={(e) =>
                          setForm((f: any) => ({
                            ...f,
                            weight: e.target.value,
                          }))
                        }
                        min={20}
                        max={300}
                        className="h-12 rounded-2xl border-border/30 bg-background/50 text-base font-light placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:shadow-primary/10 transition-all duration-300 pr-12"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded-lg">
                        kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            {isPro ? (
              <div className="space-y-6">
                {["diet", "activity", "goal"].map((category) => {
                  const categoryChoices = PREDEFINED_CHOICES.filter(
                    (choice) => choice.category === category,
                  );
                  const categoryTitle =
                    category === "diet"
                      ? "Diet Preferences"
                      : category === "activity"
                        ? "Activity Level"
                        : "Fitness Goals";

                  return (
                    <div
                      key={category}
                      className="bg-card rounded-3xl p-6 shadow-sm border border-border/30"
                    >
                      <Label className="text-sm font-semibold text-foreground/90 tracking-tight mb-4 block">
                        {categoryTitle}
                      </Label>
                      <div className="flex flex-wrap gap-3">
                        {categoryChoices.map((choice) => (
                          <Button
                            key={choice.id}
                            type="button"
                            size="sm"
                            variant={
                              form.selectedChoices.includes(choice.id)
                                ? "default"
                                : "outline"
                            }
                            className={cn(
                              "h-10 px-4 rounded-2xl text-sm font-medium transition-all duration-300 shadow-sm",
                              form.selectedChoices.includes(choice.id)
                                ? "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-primary/30"
                                : "bg-background text-foreground border-border/40 hover:bg-muted/50 hover:border-border/60 hover:shadow-md",
                            )}
                            onClick={() => toggleChoice(choice.id)}
                          >
                            {choice.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/30">
                  <Label className="text-sm font-semibold text-foreground/90 tracking-tight mb-3 block">
                    Additional Details
                  </Label>
                  <Textarea
                    placeholder="Tell us about any allergies, dietary restrictions, health conditions, or specific preferences..."
                    value={form.customText}
                    onChange={(e) => {
                      setForm((f: any) => ({
                        ...f,
                        customText: e.target.value,
                      }));
                      if (suggestionData) {
                        resetSuggestion();
                      }
                    }}
                    className="min-h-[100px] rounded-2xl border-border/30 bg-background/50 text-base font-light placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:shadow-primary/10 transition-all duration-300 resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-8 bg-gradient-to-br from-muted/30 to-muted/50 rounded-3xl border border-border/30 shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Drumstick className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  Unlock Preferences
                </h3>
                <p className="text-sm text-muted-foreground/80 leading-relaxed">
                  Upgrade to PRO for personalized diet and activity settings
                </p>
              </div>
            )}
          </div>
        );

      case "macros":
        return (
          <div className="space-y-6">
            {suggestingMacros && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-3 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary/30 border-t-primary"></div>
                <span className="font-medium">
                  Generating personalized suggestions...
                </span>
              </div>
            )}

            <div className="space-y-4">
              <MacroInput
                label="Daily Calories"
                unit="kcal"
                value={form.macros.calories}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    macros: { ...f.macros, calories: v },
                  }))
                }
                placeholder="2000"
              />
              <MacroInput
                label="Protein"
                unit="g"
                value={form.macros.protein}
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    macros: { ...f.macros, protein: v },
                  }))
                }
                placeholder="150"
              />
              <MacroInput
                label="Fat"
                unit="g"
                value={form.macros.fat}
                onChange={(v) =>
                  setForm((f) => ({ ...f, macros: { ...f.macros, fat: v } }))
                }
                placeholder="65"
              />
              <MacroInput
                label="Carbohydrates"
                unit="g"
                value={form.macros.carbs}
                onChange={(v) =>
                  setForm((f) => ({ ...f, macros: { ...f.macros, carbs: v } }))
                }
                placeholder="250"
              />
            </div>

            {!isPro &&
              form.selectedChoices.length === 0 &&
              form.customText.length <= 20 && (
                <div className="text-center p-6 bg-gradient-to-br from-muted/20 to-muted/40 rounded-3xl border border-border/30">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calculator className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground/80 font-medium">
                    Upgrade to PRO for AI-powered macro suggestions
                  </p>
                </div>
              )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <Card className="border-border bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Personal Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span className="font-medium">{form.age} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span className="font-medium">{form.height} cm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight:</span>
                  <span className="font-medium">{form.weight} kg</span>
                </div>
              </CardContent>
            </Card>

            {isPro && (form.selectedChoices.length > 0 || form.customText) && (
              <Card className="border-border bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Drumstick className="w-4 h-4" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {form.selectedChoices.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {form.selectedChoices.map((choiceId) => {
                        const choice = PREDEFINED_CHOICES.find(
                          (c) => c.id === choiceId,
                        );
                        return choice ? (
                          <span
                            key={choiceId}
                            className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                          >
                            {choice.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                  {form.customText && (
                    <p className="text-sm text-muted-foreground">
                      {form.customText}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="border-border bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Daily Macros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <MacroCard
                    label="Cal"
                    value={Number(form.macros.calories)}
                    unit="kcal"
                    tone="primary"
                  />
                  <MacroCard
                    label="Protein"
                    value={Number(form.macros.protein)}
                    unit="g"
                    tone="primary"
                  />
                  <MacroCard
                    label="Fat"
                    value={Number(form.macros.fat)}
                    unit="g"
                    tone="primary"
                  />
                  <MacroCard
                    label="Carbs"
                    value={Number(form.macros.carbs)}
                    unit="g"
                    tone="primary"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const [showFriends, setShowFriends] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {mode == "view" && (
        <div className="sticky top-0 z-50 ios-blur bg-background/80 border-b border-border/50 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 safe-area-pt">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Calari
              </h1>
            </div>
            <button
              onClick={() => setShowFriends(!showFriends)}
              className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <EggFried className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {showFriends && (
        <div className="fixed inset-0 z-40 bg-background z-9999999999999">
          <div className="sticky top-0 z-10 ios-blur bg-background/95 border-b border-border/30 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={() => {
                  setShowFriends(false);
                }}
                className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-foreground">
                  Friends
                </h1>
              </div>
              <div className="w-8" />
            </div>
          </div>
          <div className="p-4">
            <Friends />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-6 py-8 pb-32">
        {mode === "view" && !isEmptyProfile && profile ? (
          <div className="space-y-8">
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-foreground tracking-tight">
                    {profile.name}
                  </h2>
                </div>
              </div>

              <div className="bg-card/80 ios-blur border border-border/50 rounded-3xl p-6 mx-2 shadow-lg shadow-black/5">
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center space-y-2 group cursor-pointer">
                    <div className="text-2xl font-bold text-primary transition-transform duration-200 group-hover:scale-110">
                      {profile.macros?.calories.toFixed(0) || 0}
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Calories
                    </div>
                  </div>
                  <div className="text-center space-y-2 group cursor-pointer border-x border-border/30">
                    <div className="text-2xl text-white font-bold transition-transform duration-200 group-hover:scale-110">
                      {profile.macros?.carbs.toFixed(0) || 0}g
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Carbs
                    </div>
                  </div>
                  <div className="text-center text-white space-y-2 group cursor-pointer">
                    <div className="text-2xl text-white font-bold transition-transform duration-200 group-hover:scale-110">
                      {profile.macros?.protein.toFixed(0) || 0}g
                    </div>
                    <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                      Protein
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl font-semibold ios-blur border border-border/50 hover:bg-card/80 hover:border-border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-lg shadow-black/5 bg-transparent"
                onClick={startEdit}
              >
                <div className="flex items-center justify-between w-full px-2">
                  <span className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl  flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                      <Edit2 className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">
                        Edit Profile
                      </div>
                      {/*<div className="text-sm text-muted-foreground">
                        Update your information
                      </div>*/}
                    </div>
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl font-semibold bg-card/60 ios-blur border border-border/50 hover:bg-card/80 hover:border-border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-lg shadow-black/5"
                onClick={() => router.push("/profile/settings")}
              >
                <div className="flex items-center justify-between w-full px-2">
                  <span className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-secondary/20 transition-all duration-300 group-hover:scale-110">
                      <Settings className="w-6 h-6 text-WHITE" />
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">
                        Settings & Payments
                      </div>
                    </div>
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-16 rounded-2xl font-semibold bg-card/60 ios-blur border border-border/50 hover:bg-card/80 hover:border-border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group shadow-lg shadow-black/5"
                onClick={() => {
                  toast("Email at sharmavipul01002@gmail.com");
                }}
              >
                <div className="flex items-center justify-between w-full px-2">
                  <span className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-all duration-300 group-hover:scale-110">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-base font-semibold text-foreground">
                        Feedback
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Help us improve
                      </div>
                    </div>
                  </span>
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-border/30">
              <div className="text-center space-y-4">
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => {
                      router.push("/legal/privacy");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                  >
                    Privacy Policy
                  </button>
                  <div className="w-px h-4 bg-border"></div>
                  <button
                    onClick={() => {
                      router.push("/legal/terms");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
                  >
                    Terms of Service
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/70 font-medium">
                  © {new Date().getFullYear()} Calari Limited. All rights
                  reserved.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {(mode === "create" || mode === "edit") && (
          <div className="min-h-screen bg-background">
            {mode === "edit" && (
              <div className="sticky top-0 z-10 ios-blur bg-background/95 border-b border-border/30 shadow-sm">
                <div className="flex items-center justify-between px-6 py-4">
                  {isVisible ? (
                    <button
                      onClick={cancelEdit}
                      className="w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted/80 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                      <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ) : (
                    <button
                      onClick={cancelEdit}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300"
                    >
                      {/* Placeholder for X icon */}
                    </button>
                  )}
                  <div className="text-center">
                    <h1 className="text-xl font-bold text-foreground tracking-tight">
                      Edit Profile
                    </h1>
                    <p className="text-sm text-muted-foreground/70 font-medium mt-1">
                      Step {STEPS.findIndex((s) => s.id === currentStep) + 1} of{" "}
                      {STEPS.length}
                    </p>
                  </div>
                  <div className="w-10" />
                </div>
              </div>
            )}

            <div
              className={`px-6 ${mode === "create" ? "py-12 pt-16" : "py-8"} pb-40`}
            >
              <div className="max-w-md mx-auto space-y-8">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    {React.createElement(
                      STEPS.find((s) => s.id === currentStep)?.icon || User,
                      {
                        className: "w-8 h-8 text-primary",
                      },
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">
                    {STEPS.find((s) => s.id === currentStep)?.title}
                  </h2>
                  <p className="text-base text-muted-foreground/80 leading-relaxed">
                    {STEPS.find((s) => s.id === currentStep)?.description}
                  </p>
                  {mode === "create" && (
                    <p className="text-sm text-muted-foreground/70 font-medium mt-4">
                      Step {STEPS.findIndex((s) => s.id === currentStep) + 1} of{" "}
                      {STEPS.length}
                    </p>
                  )}
                </div>

                <div className="space-y-6">{renderStepContent()}</div>

                {mode === "edit" && currentStep === "macros" && (
                  <div className="flex justify-center">
                    <button
                      onClick={handleSuggestMacros}
                      disabled={suggestingMacros}
                      className="flex items-center space-x-2 px-6 py-3 rounded-2xl bg-secondary/50 hover:bg-secondary/70 text-secondary-foreground font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <span>
                        {suggestingMacros ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-1 border-t-transparent border-white"></div>
                        ) : (
                          "Suggest Macros"
                        )}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`fixed z-[9999] ${isVisible ? "bottom-0" : "bottom-0"} left-0 right-0 ios-blur bg-background/98 backdrop-blur-xl border-t border-border/40 shadow-2xl safe-area-pb`}
              style={{ zIndex: 99999 }}
            >
              <div className="px-6 py-6 pb-10">
                <div className="max-w-md mx-auto flex justify-between items-center">
                  <button
                    onClick={prevStep}
                    disabled={
                      STEPS.findIndex((s) => s.id === currentStep) === 0
                    }
                    className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
                      STEPS.findIndex((s) => s.id === currentStep) === 0
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-muted/50 active:scale-95 hover:shadow-sm"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-base font-semibold">Back</span>
                  </button>

                  {currentStep === "macros" ? (
                    <button
                      disabled={saving || !validateForm()}
                      onClick={async () => {
                        setSaving(true);
                        const ok =
                          mode === "create"
                            ? await createProfile()
                            : await updateProfile();
                        if (ok) {
                          toast(
                            mode === "create"
                              ? "Profile created successfully!"
                              : "Profile updated successfully!",
                          );
                        } else {
                          toast("Please check all required fields");
                        }
                        setSaving(false);
                      }}
                      className={`flex items-center space-x-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold transition-all duration-300 shadow-lg shadow-primary/25 ${
                        saving || !validateForm()
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-primary/90 active:scale-95 hover:shadow-xl hover:shadow-primary/30"
                      }`}
                    >
                      <span className="text-base">
                        {saving
                          ? "Saving..."
                          : mode === "create"
                            ? "Create"
                            : "Save"}
                      </span>
                      {!saving && <Check className="w-5 h-5" />}
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      disabled={!isStepValid(currentStep)}
                      className={`flex items-center space-x-3 px-8 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold transition-all duration-300 shadow-lg shadow-primary/25 ${
                        !isStepValid(currentStep)
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-primary/90 active:scale-95 hover:shadow-xl hover:shadow-primary/30"
                      }`}
                    >
                      <span className="text-base">Next</span>
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
