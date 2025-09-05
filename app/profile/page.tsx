/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCurrentDayNutrition, useUserStore } from "@/store/user-store";
import { useUpsertUser } from "@/hooks/use-user";
import { useMacroSuggestion } from "@/hooks/use-food";
import { toast } from "sonner";
import {
  X,
  ChevronRight,
  Check,
  ChevronLeft,
  User,
  Briefcase,
  Calculator,
  Eye,
  Settings,
  Target,
  Flame,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import MyRecipes from "@/components/my-recipes";
import Friends from "@/components/friends";
import { useRouter } from "next/navigation";
import { useNavBar } from "@/components/nav/nav-bar";

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
    icon: Briefcase,
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
    primary: "border-primary/30 bg-primary/5 focus-within:border-primary/50",
    secondary:
      "border-secondary/30 bg-secondary/5 focus-within:border-secondary/50",
    accent: "border-accent/30 bg-accent/5 focus-within:border-accent/50",
    muted: "border-border bg-muted/30 focus-within:border-border",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-2 transition-all duration-200",
        toneStyles[tone],
      )}
    >
      <div className="mb-2">
        <div className="text-xs font-medium text-foreground">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          type="number"
          min={0}
          className="border-none bg-transparent p-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 flex-1 px-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <span className="text-sm font-medium text-muted-foreground">
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
    } catch (error) {
      console.error("Failed to get macro suggestions:", error);
    }
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
          <div className="space-y-4">
            <div className="space-y-1">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-foreground"
              >
                Full Name
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={(e) =>
                  setForm((f: any) => ({ ...f, name: e.target.value }))
                }
                className="h-10 rounded-lg border-border bg-card"
              />
            </div>

            <div className="space-y-1">
              <Label
                htmlFor="age"
                className="text-sm font-medium text-foreground"
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
                className="h-10 rounded-lg border-border bg-card"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label
                  htmlFor="height"
                  className="text-sm font-medium text-foreground"
                >
                  Height (cm)
                </Label>
                <Input
                  id="height"
                  inputMode="numeric"
                  type="number"
                  placeholder="170"
                  value={form.height}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, height: e.target.value }))
                  }
                  min={50}
                  max={250}
                  className="h-10 rounded-lg border-border bg-card"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="weight"
                  className="text-sm font-medium text-foreground"
                >
                  Weight (kg)
                </Label>
                <Input
                  id="weight"
                  inputMode="numeric"
                  type="number"
                  placeholder="70"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((f: any) => ({ ...f, weight: e.target.value }))
                  }
                  min={20}
                  max={300}
                  className="h-10 rounded-lg border-border bg-card"
                />
              </div>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-4">
            {isPro ? (
              <div className="space-y-4">
                {["diet", "activity", "goal"].map((category) => {
                  const categoryChoices = PREDEFINED_CHOICES.filter(
                    (choice) => choice.category === category,
                  );
                  const categoryTitle =
                    category === "diet"
                      ? "Diet"
                      : category === "activity"
                        ? "Activity"
                        : "Goals";

                  return (
                    <div key={category} className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        {categoryTitle}
                      </Label>
                      <div className="flex flex-wrap gap-2">
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
                              "h-8 px-3 rounded-full text-xs",
                              form.selectedChoices.includes(choice.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground border-border hover:bg-muted",
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

                <div className="space-y-1">
                  <Label className="text-sm font-medium text-foreground">
                    Additional Details
                  </Label>
                  <Textarea
                    placeholder="Allergies, preferences, health conditions..."
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
                    className="min-h-[80px] rounded-lg border-border bg-card text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted/50 rounded-xl">
                <Briefcase className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-medium text-foreground mb-1">
                  Unlock Preferences
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upgrade to PRO for personalized settings
                </p>
              </div>
            )}
          </div>
        );

      case "macros":
        return (
          <div className="space-y-4">
            {suggestingMacros && (
              <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Generating suggestions...
              </div>
            )}

            <div className="grid grid-cols-1 gap-3">
              <MacroInput
                label="Calories"
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
                label="Carbs"
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
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to PRO for AI macro suggestions
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
                    <Briefcase className="w-4 h-4" />
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

  return (
    <main className="min-h-dvh bg-background">
      {showFriendsFullPage && (
        <div className="fixed inset-0 bg-background z-50 animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <button
              onClick={() => {
                setShowFriendsFullPage(false);
              }}
              className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-foreground">Friends</h1>
            </div>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
          <div className="p-4">
            <Friends />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-md px-4 py-6 pb-24">
        {mode === "view" && !isEmptyProfile && profile ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Calari</h1>
              <Button
                onClick={() => router.push("/profile/settings")}
                variant="ghost"
                size="sm"
                aria-label="Open settings"
                className="p-0 rounded-full h-9 w-9 sm:h-10 sm:w-10 transform-gpu transition-transform duration-150 active:scale-95 motion-reduce:active:scale-100"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <img
                src={"/icon-192x192.jpg"}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-border shadow-lg"
              />
              <h2 className="text-xl font-semibold text-foreground">
                {profile.name}
              </h2>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-full font-medium bg-transparent"
                onClick={startEdit}
              >
                Edit Profile
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-full font-medium bg-transparent"
                onClick={() => {
                  // Share functionality can be implemented here
                  toast("Share profile feature coming soon!");
                }}
              >
                Share Profile
              </Button>
            </div>

            <div className="">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-1">
                      <Flame className="h-5 w-5 text-black" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {Math.round(currentDayNutrition.totalCalories)}
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Calories
                  </div>
                </div>

                <div className="text-center p-4 bg-background rounded-xl border border-border/50 shadow-sm">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-1">
                      <Target className="h-5 w-5 text-black" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    7
                  </div>
                  <div className="text-xs text-muted-foreground font-medium">
                    Day Streak
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4" onClick={handlePress}>
              <div className="flex  active:scale-95 transition-transform duration-150 items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  My Recipes
                </h3>
                <h3 className="text-lg font-semibold text-foreground">
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowUpRight />
                  )}
                </h3>
              </div>
              <MyRecipes />
            </div>
          </div>
        ) : null}

        {(mode === "create" || mode === "edit") && (
          <div className="min-h-screen bg-background">
            {/* iOS-style header with X button */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
              <div className="flex items-center justify-between px-4 py-3">
                {isVisible ? (
                  <button
                    onClick={cancelEdit}
                    className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                ) : (
                  <button
                    onClick={cancelEdit}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  >
                    {/* Placeholder for X icon */}
                  </button>
                )}
                <div className="text-center">
                  <h1 className="text-lg font-semibold text-foreground">
                    {mode === "create" ? "Create Profile" : "Edit Profile"}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Step {STEPS.findIndex((s) => s.id === currentStep) + 1} of{" "}
                    {STEPS.length}
                  </p>
                </div>
                <div className="w-8" /> {/* Spacer for centering */}
              </div>

              {/* Content area with iOS-style forms */}
              <div className="px-4 py-6 pb-32">
                <div className="space-y-6">
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {STEPS.find((s) => s.id === currentStep)?.description}
                    </p>
                  </div>

                  {/* iOS-style form content */}
                  <div className="space-y-4">{renderStepContent()}</div>
                </div>
              </div>

              {/* iOS-style bottom navigation */}
              <div
                className={`fixed ${isVisible ? "bottom-0" : "bottom-0"} left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border/50 safe-area-pb`}
              >
                <div className="px-4 py-4 pb-8">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={prevStep}
                      disabled={
                        STEPS.findIndex((s) => s.id === currentStep) === 0
                      }
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                        STEPS.findIndex((s) => s.id === currentStep) === 0
                          ? "opacity-30 cursor-not-allowed"
                          : "hover:bg-muted active:scale-95"
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="text-sm font-medium">Back</span>
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
                        className={`flex items-center space-x-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-200 ${
                          saving || !validateForm()
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary/90 active:scale-95"
                        }`}
                      >
                        <span>
                          {saving
                            ? "Saving..."
                            : mode === "create"
                              ? "Create"
                              : "Save"}
                        </span>
                        {!saving && <Check className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button
                        onClick={nextStep}
                        disabled={!isStepValid(currentStep)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium transition-all duration-200 ${
                          !isStepValid(currentStep)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary/90 active:scale-95"
                        }`}
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
