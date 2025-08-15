/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X, ChevronLeft, Edit3, User, ArrowRight, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useImageUpload } from "@/hooks/use-upload"
import { type FoodAnalysisContext, useFoodAnalysis } from "@/hooks/use-food"
import { useCurrentDayNutrition, useUserStore } from "@/store/user-store"
import { Card, CardContent } from "@/components/ui/card"
import { useMealCountStore } from "@/store/use-count"

export default function CameraPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [flash, setFlash] = useState(false)
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const { user } = useUserStore()

  // Upload and analysis hooks
  const { uploadImage, uploading, progress, error: uploadError } = useImageUpload()
  const { analyzeImage, analyzeText, analyzing, error: analysisError, result: analysisResult } = useFoodAnalysis()

  const { mealsScanned } = useMealCountStore()
  // Manual entry card state
  const [isManualCardOpen, setIsManualCardOpen] = useState(false)
  const [manualFoodName, setManualFoodName] = useState("")
  const [manualQuantity, setManualQuantity] = useState("")

  const router = useRouter()
  const currentDayNutrition = useCurrentDayNutrition()

  // User context for personalized recommendations
  const userContext: FoodAnalysisContext | undefined =
    user?.plan != "basic"
      ? {
          userInfo: user?.profile.profileText,
          totalMacros: user?.profile.macros,
          consumedMacros: {
            calories: currentDayNutrition?.totalCalories,
            carbs: currentDayNutrition?.totalCarbs,
            protein: currentDayNutrition?.totalProtein,
            fat: currentDayNutrition?.totalFat,
          },
        }
      : undefined

  // Default food info (fallback for demo)
  const defaultFood = { name: "Avocado Toast", quantity: "1 slice" }
  const defaultMacros = { calories: 250, fat: 18, protein: 6, carbs: 18 }

  const cleanupCamera = useCallback(() => {
    try {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => {
          track.stop()
        })
        videoRef.current.srcObject = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop()
        })
        streamRef.current = null
      }
    } catch {}
  }, [])

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          const playWhenReady = () => {
            video.play().catch(() => {
              // Autoplay might be blocked; will start on first tap
            })
          }
          if (video.readyState >= 2) playWhenReady()
          else video.onloadedmetadata = playWhenReady
        }
      } catch {}
    }
    startCamera()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupCamera()
      }
    }

    const handleBeforeUnload = () => {
      cleanupCamera()
    }

    const handlePopState = () => {
      cleanupCamera()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      cleanupCamera()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [cleanupCamera])

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const ensureFullscreen = useCallback(async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen()
        // @ts-expect-error vendor-prefixed
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      } catch {
        // ignore; layout already covers full screen
      }
    }
  }, [])

  const hapticTap = useCallback(() => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.([10, 20, 10])
    } catch {
      // ignore
    }
  }, [])

  const capturePhoto = useCallback(async () => {
    await ensureFullscreen()
    const video = videoRef.current
    if (!video) return

    hapticTap()
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
    setIsCardOpen(true)

    const { videoWidth, videoHeight } = video
    if (!videoWidth || !videoHeight) return

    const canvas = document.createElement("canvas")
    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        setPhotoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })

        const file = new File([blob], `food-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
        setCapturedFile(file)
        handleUploadAndAnalyze(file)
      },
      "image/jpeg",
      0.92,
    )
  }, [ensureFullscreen, hapticTap])

  const handleUploadAndAnalyze = useCallback(
    async (file: File) => {
      try {
        const uploadResult = await uploadImage(file)
        await analyzeImage(uploadResult.hostableLink, userContext)
      } catch {}
    },
    [uploadImage, analyzeImage, userContext],
  )

  const handleManualAnalysis = useCallback(async () => {
    if (!manualFoodName.trim() || !manualQuantity.trim()) return

    try {
      await analyzeText(manualFoodName.trim(), manualQuantity.trim(), userContext)
      setIsManualCardOpen(false)
      setIsCardOpen(true)
    } catch {}
  }, [manualFoodName, manualQuantity, analyzeText, userContext])

  const closeCard = useCallback(() => {
    setIsCardOpen(false)
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setCapturedFile(null)
  }, [photoUrl])

  const openManualCard = useCallback(() => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(10)
    } catch {}
    setIsManualCardOpen(true)
  }, [])

  const closeManualCard = useCallback(() => {
    setIsManualCardOpen(false)
    setManualFoodName("")
    setManualQuantity("")
  }, [])

  const handleSetupProfile = () => {
    router.push("/profile")
  }

  const handleRetry = useCallback(() => {
    if (capturedFile) {
      handleUploadAndAnalyze(capturedFile)
    }
  }, [capturedFile, handleUploadAndAnalyze])

  const handleViewFullAnalysis = useCallback(() => {
    if (user?.plan == "basic") {
      // alert("Tracked")
      // return
    }
    if (analysisResult?.data) {
      sessionStorage.setItem(
        "foodAnalysisData",
        JSON.stringify({
          analysisResult,
          photoUrl,
          analysisType: analysisResult.analysisType || "image",
        }),
      )

      router.push("/analysis")

      try {
        if ("vibrate" in navigator) navigator.vibrate?.(15)
      } catch {}
    }
  }, [analysisResult, photoUrl, router])

  const profile = user?.profile
  const isEmptyProfile = useMemo(() => {
    if (!profile) return true
    if (Object.keys(profile).length === 0) return true
    if (!profile.name || !profile.age || !profile.macros) return true
    const macros = profile.macros
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs) return true
    return false
  }, [profile])

  const currentFood = analysisResult?.data?.foodItems?.[0] || defaultFood
  const currentMacros = analysisResult?.data?.totalMacros || defaultMacros

  if (isEmptyProfile)
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <Card className="w-full max-w-md bg-card border border-border shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground mb-3 font-heading">Complete Your Profile</h1>
              <p className="text-muted-foreground leading-relaxed font-body">
                Set up your profile to personalize your experience and connect with others.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSetupProfile}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                Set Up Profile
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )

  return (
    <main
      ref={containerRef}
      className="fixed inset-0 text-foreground bg-background"
      style={
        {
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
          "--bottom-ui": "24px",
        } as React.CSSProperties
      }
      aria-label="Camera view"
    >
      {/* Camera Preview */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* Subtle vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Top header overlay */}
      <header
        className="absolute inset-x-0 top-0 z-20"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
        aria-label="Camera header"
      >
        <div className="mx-auto max-w-screen-sm px-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Back"
              onClick={() => {
                cleanupCamera()
                router.push("/home")
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-md hover:bg-card transition active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </button>

            <div className="rounded-full bg-card/90 backdrop-blur-md px-4 py-2 shadow-sm border border-border">
              <span className="font-semibold tracking-wide font-heading">Calari</span>
            </div>

            <Button
              type="button"
              onClick={openManualCard}
              variant="secondary"
              aria-label="Enter food manually"
              className="h-10 rounded-full border border-border bg-card/90 text-foreground shadow-sm backdrop-blur-md hover:bg-muted transition active:scale-95"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Flash overlay */}
      {flash ? <div className="pointer-events-none absolute inset-0 z-40 bg-background/90" /> : null}

      {/* Shutter Button */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
        }}
      >
        <button
          type="button"
          aria-label="Take photo"
          onClick={capturePhoto}
          disabled={isCardOpen || uploading || analyzing}
          aria-disabled={isCardOpen || uploading || analyzing}
          className="group relative h-20 w-20 select-none rounded-full border-2 border-border bg-card/95 shadow-lg backdrop-blur-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-card"
        >
          {/* Show upload progress in button */}
          {uploading && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-secondary animate-spin" />
          )}

          {/* Show analysis progress in button */}
          {analyzing && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin" />
          )}

          <span className="absolute inset-2 rounded-full bg-background transition group-active:scale-95 shadow-sm" />
          <span className="absolute inset-0 grid place-items-center" />
        </button>
      </div>

      {/* Bottom-sheet Card */}
      <div
        className={`absolute inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal={isCardOpen}
        aria-hidden={!isCardOpen}
      >
        <div
          className="w-full rounded-t-2xl bg-card/95 backdrop-blur-md shadow-2xl border-t border-border"
          style={{
            height: "40vh",
            paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
          }}
        >
          {/* Card header with close */}
          <div className="relative flex items-center px-4 pt-3 pb-2">
            <div
              className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={closeCard}
              className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content area */}
          <div className="h-[calc(40vh-56px)] overflow-auto px-4 pb-4">
            {uploading ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-secondary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-lg font-medium font-heading">Just a second...</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div
                      className="bg-secondary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 font-body">{progress}%</p>
                </div>
              </div>
            ) : analyzing ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-lg font-medium font-heading">Almost there</p>
                  <p className="text-sm text-muted-foreground font-body">
                    Identifying ingredients and calculating nutrition
                  </p>
                </div>
              </div>
            ) : uploadError || analysisError ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-destructive mb-2 font-heading">
                    {uploadError ? "Upload Failed" : "Analysis Failed"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed font-body">
                    {uploadError
                      ? "We couldn't upload your image. Please check your connection and try again."
                      : "We couldn't analyze your food. Please try taking another photo or enter the details manually."}
                  </p>
                  {(uploadError || analysisError) && (
                    <details className="text-xs text-muted-foreground mb-4">
                      <summary className="cursor-pointer hover:text-foreground font-body">Technical details</summary>
                      <p className="mt-2 p-2 bg-muted rounded text-left font-mono">{uploadError || analysisError}</p>
                    </details>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    className="w-full h-11 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground transition flex items-center justify-center gap-2"
                    disabled={uploading || analyzing}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeCard()
                      openManualCard()
                    }}
                    className="w-full h-11 rounded-lg border border-border hover:bg-muted transition"
                  >
                    Enter Manually Instead
                  </Button>
                </div>
              </div>
            ) : analysisResult?.success ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground font-heading">{currentFood.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 font-body">{currentFood.quantity}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SimpleMacro label="Calories" value={currentMacros.calories} unit="kcal" />
                  <SimpleMacro label="Protein" value={currentMacros.protein} unit="g" />
                  <SimpleMacro label="Carbs" value={currentMacros.carbs} unit="g" />
                  <SimpleMacro label="Fat" value={currentMacros.fat} unit="g" />
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-lg border border-border hover:bg-muted transition bg-transparent"
                    onClick={handleViewFullAnalysis}
                  >
                    Track
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-pulse">
                <div className="text-center space-y-2">
                  <div className="h-6 w-2/3 rounded bg-muted mx-auto" />
                  <div className="h-4 w-1/2 rounded bg-muted mx-auto" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-lg bg-muted" />
                  <div className="h-16 rounded-lg bg-muted" />
                  <div className="h-16 rounded-lg bg-muted" />
                  <div className="h-16 rounded-lg bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-11 w-full rounded-lg bg-muted" />
                  <div className="h-11 w-full rounded-lg bg-muted" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual entry card */}
      <div
        className={`absolute inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isManualCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal={isManualCardOpen}
        aria-hidden={!isManualCardOpen}
      >
        <div
          className="w-full rounded-t-2xl bg-card/95 backdrop-blur-md shadow-2xl border-t border-border"
          style={{
            height: "50vh",
            paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
          }}
        >
          <div className="relative flex items-center px-4 pt-3 pb-2">
            <div
              className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-muted"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close manual entry"
              onClick={closeManualCard}
              className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(50vh-56px)] overflow-auto px-4 pb-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="manual-food" className="text-foreground font-body">
                  What are you eating?
                </Label>
                <Input
                  id="manual-food"
                  placeholder="e.g. Grilled Chicken Breast"
                  value={manualFoodName}
                  onChange={(e: any) => setManualFoodName(e.target.value)}
                  className="h-11 rounded-lg bg-input border-border shadow-sm"
                  disabled={analyzing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-qty" className="text-foreground font-body">
                  Quantity
                </Label>
                <Input
                  id="manual-qty"
                  placeholder="e.g. 200g, 1 cup, 1 medium"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(e.target.value)}
                  className="h-11 rounded-lg bg-input border-border shadow-sm"
                  disabled={analyzing}
                />
              </div>

              <Button
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                onClick={handleManualAnalysis}
                disabled={!manualFoodName.trim() || !manualQuantity.trim() || analyzing}
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    Analyzing...
                  </div>
                ) : (
                  "Analyze Food"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Simplified macro component for the card
function SimpleMacro({
  label,
  value,
  unit,
}: {
  label: string
  value: number
  unit: string
}) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted border border-border shadow-sm">
      <div className="text-sm font-medium text-muted-foreground font-body">{label}</div>
      <div className="text-xl font-bold text-foreground mt-1 font-heading">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1 font-body">{unit}</span>
      </div>
    </div>
  )
}
