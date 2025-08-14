/* eslint-disable react-hooks/exhaustive-deps */
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
  const streamRef = useRef<MediaStream | null>(null) // Added ref to track stream for better cleanup
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
  const currentDayNutrition= useCurrentDayNutrition()

  // User context for personalized recommendations
  const userContext: FoodAnalysisContext | undefined =
    user?.plan != "basic"
      ? {
          userInfo: user?.profile.profileText,
          totalMacros: user?.profile.macros,
          consumedMacros: {
            calories:currentDayNutrition?.totalCalories,
            carbs:currentDayNutrition?.totalCarbs,
            protein:currentDayNutrition?.totalProtein,
            fat:currentDayNutrition?.totalFat
          } ,
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
    } catch{
    }
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
        streamRef.current = stream // Store stream in ref for cleanup
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
      } catch {
      }
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

    // Add event listeners for various ways user might leave
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      cleanupCamera()
      // Remove event listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [cleanupCamera])

  // Clean up blob URLs when replaced or on unmount
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

    // Haptic feedback
    hapticTap()

    // Flash effect
    setFlash(true)
    setTimeout(() => setFlash(false), 120)

    // Open the card immediately
    setIsCardOpen(true)

    const { videoWidth, videoHeight } = video
    if (!videoWidth || !videoHeight) return

    const canvas = document.createElement("canvas")
    canvas.width = videoWidth
    canvas.height = videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw current frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight)

    canvas.toBlob(
      (blob) => {
        if (!blob) return

        // Create preview URL
        const url = URL.createObjectURL(blob)
        setPhotoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })

        // Create File object for upload
        const file = new File([blob], `food-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        })
        setCapturedFile(file)

        // Start upload and analysis automatically
        handleUploadAndAnalyze(file)
      },
      "image/jpeg",
      0.92,
    )
  }, [ensureFullscreen, hapticTap])

  // Function to handle upload and analysis
  const handleUploadAndAnalyze = useCallback(
    async (file: File) => {
      try {
        // Step 1: Upload to Cloudinary
        const uploadResult = await uploadImage(file)

        // Step 2: Analyze the food image
        await analyzeImage(uploadResult.hostableLink, userContext)
      } catch{
      }
    },
    [uploadImage, analyzeImage, userContext],
  )

  // Handle manual text analysis
  const handleManualAnalysis = useCallback(async () => {
    if (!manualFoodName.trim() || !manualQuantity.trim()) return

    try {
      await analyzeText(manualFoodName.trim(), manualQuantity.trim(), userContext)
      setIsManualCardOpen(false)
      setIsCardOpen(true) // Show results in the main card
    } catch {
    }
  }, [manualFoodName, manualQuantity, analyzeText, userContext])

  const closeCard = useCallback(() => {
    setIsCardOpen(false)
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    setPhotoUrl(null)
    setCapturedFile(null)
  }, [photoUrl])

  // Manual card handlers
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

  // Navigate to analysis page with full data
  const handleViewFullAnalysis = useCallback(() => {
    if (user?.plan == "basic") {
      // alert("Tracked")
      // return
    }
    if (analysisResult?.data) {
      // Store analysis data in sessionStorage for the analysis page
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

    // Check if profile is empty object {}
    if (Object.keys(profile).length === 0) return true

    // Check if profile lacks essential fields
    if (!profile.name || !profile.age || !profile.macros) return true

    // Check if macros are empty
    const macros = profile.macros
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs) return true

    return false
  }, [profile])

  // Get current food info (from analysis or default)
  const currentFood = analysisResult?.data?.foodItems?.[0] || defaultFood
  const currentMacros = analysisResult?.data?.totalMacros || defaultMacros

  if((mealsScanned<=3 && user?.plan=="basic") || mealsScanned>=19) return <>
  You cannot scan more meals today
  </>

  if (isEmptyProfile)
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-white dark:bg-black">
        <Card className="w-full max-w-md bg-white/95 dark:bg-black/95 backdrop-blur-xl border-0 shadow-2xl shadow-gray-200/50 dark:shadow-black/50">
          <CardContent className="p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-500/25 dark:shadow-white/20">
                <User className="w-8 h-8 text-white dark:text-black" />
              </div>
            </div>

            {/* Content */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-black dark:text-white mb-3 tracking-tight">
                Complete Your Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Set up your profile to personalize your experience and connect with others.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleSetupProfile}
                className="w-full h-12 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium rounded-xl transition-all duration-200 shadow-lg shadow-gray-500/25 dark:shadow-white/20 hover:shadow-xl hover:shadow-gray-500/30 dark:hover:shadow-white/30 flex items-center justify-center gap-2"
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
      className="fixed inset-0 text-black bg-white dark:bg-black dark:text-neutral-50"
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

      {/* Light, subtle vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.18) 100%)",
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 text-neutral-800 shadow-sm backdrop-blur-md hover:bg-white transition active:scale-95 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </button>

            <div className="rounded-full bg-white/70 backdrop-blur-md px-4 py-2 shadow-sm border border-black/10 dark:bg-neutral-900/70 dark:border-white/10">
              <span className="font-semibold tracking-wide">Calari</span>
            </div>

            <Button
              type="button"
              onClick={openManualCard}
              variant="secondary"
              aria-label="Enter food manually"
              className="h-10 rounded-full border border-black/10 bg-white/70 text-neutral-800 shadow-sm backdrop-blur-md hover:bg-white transition active:scale-95 dark:border-white/10 dark:bg-neutral-900/70 dark:text-neutral-200 dark:hover:bg-neutral-900"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Flash overlay */}
      {flash ? <div className="pointer-events-none absolute inset-0 z-40 bg-white/90" /> : null}

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
          className="group relative h-20 w-20 select-none rounded-full border border-black/10 bg-white/80 shadow-lg backdrop-blur-xl transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:bg-neutral-900"
          style={{
            boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.9), 0 8px 28px rgba(0,0,0,0.18)",
          }}
        >
          {/* Show upload progress in button */}
          {uploading && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
          )}

          {/* Show analysis progress in button */}
          {analyzing && (
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
          )}

          <span
            className="pointer-events-none absolute inset-[-6px] rounded-full bg-emerald-400/10 blur-md opacity-0 group-hover:opacity-100 transition animate-[pulseSoft_2.4s_ease-in-out_infinite]"
            aria-hidden="true"
          />
          <span className="absolute inset-2 rounded-full bg-white transition group-active:scale-95 dark:bg-neutral-800" />
          <span className="absolute inset-0 grid place-items-center" />
        </button>
      </div>

      {/* Bottom-sheet Card (Simplified Analysis results) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal={isCardOpen}
        aria-hidden={!isCardOpen}
      >
        <div
          className="w-full rounded-t-3xl bg-white/80 backdrop-blur-md shadow-2xl border-t border-neutral-200 dark:bg-neutral-900/80 dark:border-neutral-800"
          style={{
            height: "40vh", // Reduced height for simplified content
            paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
          }}
        >
          {/* Card header with close */}
          <div className="relative flex items-center px-4 pt-3 pb-2">
            <div
              className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={closeCard}
              className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content area */}
          <div className="h-[calc(40vh-56px)] overflow-auto px-4 pb-4">
            {uploading ? (
              // Upload progress
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-lg font-medium">Just a second...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{progress}%</p>
                </div>
              </div>
            ) : analyzing ? (
              // Analysis progress
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-lg font-medium">Almost there</p>
                  <p className="text-sm text-gray-600">Identifying ingredients and calculating nutrition</p>
                </div>
              </div>
            ) : uploadError || analysisError ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    {uploadError ? "Upload Failed" : "Analysis Failed"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {uploadError
                      ? "We couldn't upload your image. Please check your connection and try again."
                      : "We couldn't analyze your food. Please try taking another photo or enter the details manually."}
                  </p>
                  {/* Error details (for debugging) */}
                  {(uploadError || analysisError) && (
                    <details className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <summary className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                        Technical details
                      </summary>
                      <p className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-left font-mono">
                        {uploadError || analysisError}
                      </p>
                    </details>
                  )}
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleRetry}
                    className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white transition flex items-center justify-center gap-2"
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
                    className="w-full h-11 rounded-xl border-2 border-neutral-300 hover:bg-neutral-50 transition dark:border-neutral-600 dark:hover:bg-neutral-800"
                  >
                    Enter Manually Instead
                  </Button>
                </div>
              </div>
            ) : analysisResult?.success ? (
              // Simplified Analysis results - Only name, quantity, and macros
              <div className="space-y-4">
                {/* Food name and quantity */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{currentFood.name}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{currentFood.quantity}</p>
                </div>

                {/* Macros only */}
                <div className="grid grid-cols-2 gap-3">
                  <SimpleMacro label="Calories" value={currentMacros.calories} unit="kcal" />
                  <SimpleMacro label="Protein" value={currentMacros.protein} unit="g" />
                  <SimpleMacro label="Carbs" value={currentMacros.carbs} unit="g" />
                  <SimpleMacro label="Fat" value={currentMacros.fat} unit="g" />
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    variant="outline"
                    className="w-full h-11 rounded-xl border-2 border-neutral-300 hover:bg-neutral-50 transition dark:border-neutral-600 dark:hover:bg-neutral-800 bg-transparent"
                    onClick={handleViewFullAnalysis}
                  >
                    Track
                  </Button>
                </div>
              </div>
            ) : (
              // Initial skeleton
              <div className="space-y-4 animate-pulse">
                <div className="text-center space-y-2">
                  <div className="h-6 w-2/3 rounded bg-neutral-200 dark:bg-neutral-800 mx-auto" />
                  <div className="h-4 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 mx-auto" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-16 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
                <div className="space-y-2">
                  <div className="h-11 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                  <div className="h-11 w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual entry card (unchanged) */}
      <div
        className={`absolute inset-x-0 bottom-0 z-50 transform transition-transform duration-300 ease-out will-change-transform ${
          isManualCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal={isManualCardOpen}
        aria-hidden={!isManualCardOpen}
      >
        <div
          className="w-full rounded-t-3xl bg-white/80 backdrop-blur-md shadow-2xl border-t border-neutral-200 dark:bg-neutral-900/80 dark:border-neutral-800"
          style={{
            height: "50vh",
            paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
          }}
        >
          <div className="relative flex items-center px-4 pt-3 pb-2">
            <div
              className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-neutral-200 dark:bg-neutral-700"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close manual entry"
              onClick={closeManualCard}
              className="ml-auto inline-flex items-center justify-center rounded-full p-2 text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 transition dark:text-neutral-300 dark:hover:text-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(50vh-56px)] overflow-auto px-4 pb-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="manual-food" className="text-neutral-700 dark:text-neutral-300">
                  What are you eating?
                </Label>
                <Input
                  id="manual-food"
                  placeholder="e.g. Grilled Chicken Breast"
                  value={manualFoodName}
                  onChange={(e: any) => setManualFoodName(e.target.value)}
                  className="h-11 rounded-xl bg-white/90 border-neutral-200 shadow-sm dark:bg-neutral-900/60 dark:border-neutral-800"
                  disabled={analyzing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manual-qty" className="text-neutral-700 dark:text-neutral-300">
                  Quantity
                </Label>
                <Input
                  id="manual-qty"
                  placeholder="e.g. 200g, 1 cup, 1 medium"
                  value={manualQuantity}
                  onChange={(e) => setManualQuantity(e.target.value)}
                  className="h-11 rounded-xl bg-white/90 border-neutral-200 shadow-sm dark:bg-neutral-900/60 dark:border-neutral-800"
                  disabled={analyzing}
                />
              </div>

              <Button
                className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 transition shadow-sm dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 disabled:opacity-50"
                onClick={handleManualAnalysis}
                disabled={!manualFoodName.trim() || !manualQuantity.trim() || analyzing}
              >
                {analyzing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
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

      <style>{`@keyframes pulseSoft { 0%, 100% { transform: scale(0.98); opacity: 0.55; } 50% { transform: scale(1.04); opacity: 0.85; } }`}</style>
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
    <div className="text-center p-3 rounded-lg bg-neutral-50 border border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{label}</div>
      <div className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
        {value}
        <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400 ml-1">{unit}
          </span>
      </div>
    </div>
  )
}
