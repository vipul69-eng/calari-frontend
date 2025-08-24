/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useImageUpload } from "@/hooks/use-upload"
import { type FoodAnalysisContext, useFoodAnalysis, useFoodExtraction } from "@/hooks/use-food"
import { useCurrentDayNutrition, useUserStore } from "@/store/user-store"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CameraNavBar } from "@/components/camera-nav"
import { useDailyMeals } from "@/hooks/use-meals"
import { useAuth } from "@clerk/nextjs"

function ScanningFrame() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 300px 220px at center, transparent 35%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.4) 85%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      <div className="relative w-80 h-52 rounded-3xl">
        {/* Animated corner indicators */}
        <div className="absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-2xl opacity-90 animate-pulse" />
        <div className="absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-2xl opacity-90 animate-pulse" />
        <div className="absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-2xl opacity-90 animate-pulse" />
        <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-2xl opacity-90 animate-pulse" />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-white rounded-full opacity-60 animate-ping" />
          <div className="absolute w-2 h-2 bg-white rounded-full opacity-80" />
        </div>
      </div>
    </div>
  )
}

function VoiceAnimation() {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 300px 220px at center, transparent 35%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.5) 85%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative flex items-center justify-center">
        {/* Voice wave animation */}
        <div className="flex items-center gap-1">
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "20px", animationDelay: "0ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "35px", animationDelay: "150ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "25px", animationDelay: "300ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "40px", animationDelay: "450ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "30px", animationDelay: "600ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "45px", animationDelay: "750ms", animationDuration: "1s" }}
          />
          <div
            className="w-1 bg-white rounded-full animate-pulse"
            style={{ height: "25px", animationDelay: "900ms", animationDuration: "1s" }}
          />
        </div>
      </div>
    </div>
  )
}

function EnhancedMacro({
  label,
  value,
  unit,
  isLoading = false,
}: {
  label: string
  value: number
  unit: string
  isLoading?: boolean
}) {
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-center">
        <div className="h-3 w-12 bg-muted rounded mx-auto mb-2 animate-pulse" />
        <div className="h-5 w-8 bg-muted rounded mx-auto animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
      <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-semibold text-card-foreground">
        {value}
        <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
      </div>
    </div>
  )
}

function LoadingState({
  type,
  progress = 0,
  message,
}: {
  type: "upload" | "analyze" | "processing" | "voice"
  progress?: number
  message: string
}) {
  const getLoadingIndicator = () => {
    switch (type) {
      case "upload":
        return <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
      case "analyze":
        return <div className="animate-pulse w-6 h-6 bg-primary rounded-full" />
      case "processing":
        return <div className="animate-spin w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full" />
      case "voice":
        return <div className="animate-pulse w-6 h-6 bg-primary rounded-full" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex justify-center mb-4">{getLoadingIndicator()}</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{message}</h3>

        {type === "upload" && (
          <>
            <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{progress}% uploaded</p>
          </>
        )}

        {(type === "analyze" || type === "voice") && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function CameraPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recognitionRef = useRef<any>(null)
  const [flash, setFlash] = useState(false)
  const [isCardOpen, setIsCardOpen] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined)
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const { user, calculateAndSaveDailyCalories } = useUserStore()

  const [isListening, setIsListening] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [editedQuantity, setEditedQuantity] = useState("")
  const [hasEditedQuantity, setHasEditedQuantity] = useState(false)
  const [updatedMacros, setUpdatedMacros] = useState<any>(null)
  const [isUpdatingMacros, setIsUpdatingMacros] = useState(false)
  const [tracking, setTracking] = useState(false)

  const [isSafari, setIsSafari] = useState(false)
  const [showSafariWarning, setShowSafariWarning] = useState(false)
  const [extracting, setExtracting] = useState(false) // Declare setExtracting variable
  const { trackMeal } = useDailyMeals()
  // Upload and analysis hooks
  const { uploadImage, uploading, progress, error: uploadError } = useImageUpload()
  const { analyzeImage, analyzeText, analyzing, error: analysisError, result: analysisResult } = useFoodAnalysis()
  const {
    extractFood,
    extracting: extractingState,
    error: extractionError,
    result: extractionResult,
  } = useFoodExtraction()

  // Manual entry card state
  const [isManualCardOpen, setIsManualCardOpen] = useState(false)
  const [manualFoodName, setManualFoodName] = useState("")
  const [manualQuantity, setManualQuantity] = useState("")
  const { getToken } = useAuth()

  const router = useRouter()
  const currentDayNutrition = useCurrentDayNutrition()

  // User context for personalized recommendations
  const userContext: FoodAnalysisContext | undefined = useMemo(
    () =>
      user?.plan != "basic"
        ? {
            userInfo: user?.profile.profileText,
            totalMacros: user?.profile.macros,
            consumedMacros: {
              calories: currentDayNutrition?.totalCalories,
              protein: currentDayNutrition?.totalProtein,
              carbs: currentDayNutrition?.totalCarbs,
              fat: currentDayNutrition?.totalFat,
            },
          }
        : undefined,
    [
      user?.plan,
      user?.profile.profileText,
      user?.profile.macros,
      currentDayNutrition?.totalCalories,
      currentDayNutrition?.totalCarbs,
      currentDayNutrition?.totalProtein,
      currentDayNutrition?.totalFat,
    ],
  )

  // Default food info (fallback for demo)
  const defaultFood = { name: "Avocado Toast", quantity: "1 slice" }
  const defaultMacros = { calories: 250, fat: 18, protein: 6, carbs: 18 }

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent)
    setIsSafari(isSafariBrowser)

    if (isSafariBrowser && !("webkitSpeechRecognition" in window)) {
      setShowSafariWarning(true)
    }

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setVoiceText(transcript)
        handleVoiceResult(transcript)
      }

      recognitionRef.current.onerror = (event: any) => {
        setVoiceError(`Voice recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        if (voiceText && !analyzing && !uploading) {
          setExtracting(true)
        }
      }
    }
  }, [voiceText, analyzing, uploading])

  const handleVoiceResult = useCallback(
    async (transcript: string) => {
      try {
        setVoiceError(null)
        const extractedFood = await extractFood(transcript)
        console.log(extractedFood, "food")
        if (extractedFood) {
          if (extractedFood.quantity) {
            // Has quantity, analyze directly
            await analyzeText(extractedFood.name, extractedFood.quantity, userContext)
            setIsCardOpen(true)
          } else {
            // Missing quantity, open manual input with food name pre-filled
            setManualFoodName(extractedFood.name)
            setManualQuantity("")
            setIsManualCardOpen(true)
          }
        } else {
          setVoiceError("Could not extract food information from voice input")
        }
      } catch (error) {
        setVoiceError("Failed to process voice input")
      }
    },
    [extractFood, analyzeText, userContext],
  )

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setVoiceText("")
      setVoiceError(null)
      setIsListening(true)
      recognitionRef.current.start()
      hapticTap()
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      if (voiceText) {
        setExtracting(true)
      }
    }
  }, [isListening, voiceText])

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

    setTimeout(() => setIsCardOpen(true), 150)

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
    setPhotoUrl(undefined)
    setCapturedFile(null)
    setIsEditingQuantity(false)
    setEditedQuantity("")
    setHasEditedQuantity(false)
    setUpdatedMacros(null)
    setIsUpdatingMacros(false)
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

  const handleEditQuantity = useCallback(() => {
    if (hasEditedQuantity) return // Only allow editing once

    const currentFood = analysisResult?.data?.foodItems?.[0]
    if (currentFood) {
      setEditedQuantity(currentFood.quantity)
      setIsEditingQuantity(true)
    }
  }, [analysisResult, hasEditedQuantity])

  const handleUpdateMacros = useCallback(async () => {
    if (!editedQuantity.trim() || !analysisResult?.data?.foodItems?.[0]) return

    const currentFood = analysisResult.data.foodItems[0]
    setIsUpdatingMacros(true)

    try {
      // Make API call similar to text analysis but for quantity update
      const result = await analyzeText(currentFood.name, editedQuantity.trim(), userContext)

      if (result?.success && result?.data) {
        setUpdatedMacros(result.data.totalMacros)
        setHasEditedQuantity(true)
        setIsEditingQuantity(false)

        // Update the analysis result with new quantity and macros
        const updatedResult = {
          ...analysisResult,
          data: {
            ...analysisResult.data,
            foodItems: [
              {
                ...currentFood,
                quantity: editedQuantity.trim(),
              },
            ],
            totalMacros: result.data.totalMacros,
          },
        }

        // Store updated result for tracking
        sessionStorage.setItem(
          "foodAnalysisData",
          JSON.stringify({
            analysisResult: updatedResult,
            photoUrl,
            analysisType: "image_with_quantity_edit",
          }),
        )
      }
    } catch (error) {
      console.error("Failed to update macros:", error)
    } finally {
      setIsUpdatingMacros(false)
    }
  }, [editedQuantity, analysisResult, userContext, photoUrl])

  const handleCancelEdit = useCallback(() => {
    setIsEditingQuantity(false)
    setEditedQuantity("")
  }, [])

  const handleViewFullAnalysis = useCallback(() => {
    if (analysisResult?.data) {
      setTracking(true)
      const finalResult =
        hasEditedQuantity && updatedMacros
          ? {
              ...analysisResult,
              data: {
                ...analysisResult.data,
                foodItems: [
                  {
                    ...analysisResult.data.foodItems[0],
                    quantity: editedQuantity,
                  },
                ],
                totalMacros: updatedMacros,
              },
            }
          : analysisResult

      sessionStorage.setItem(
        "foodAnalysisData",
        JSON.stringify({
          analysisResult: finalResult,
          photoUrl,
          analysisType: hasEditedQuantity ? "image_with_quantity_edit" : analysisResult.analysisType || "image",
        }),
      )

      router.push("/analysis")
      setTracking(false)
      try {
        if ("vibrate" in navigator) navigator.vibrate?.(15)
      } catch {}
    }
  }, [analysisResult, photoUrl, router, hasEditedQuantity, updatedMacros, editedQuantity])

  const handleAddMeal = useCallback(async () => {
    if (!analysisResult?.data || !currentDayNutrition) return

    setTracking(true)
    try {
      // Create combined meal name from all items
      const mealName = analysisResult.data.foodItems.map((item) => item.name).join(", ")

      // Create combined quantity description
      const combinedQuantity = analysisResult.data.foodItems.map((item) => `${item.name}: ${item.quantity}`).join(", ")
      const token = await getToken()
      if (!token) return
      // Track the meal using store logic
      await trackMeal(
        mealName, // Combined meal name
        combinedQuantity, // Combined quantity description
        analysisResult.data.totalMacros, // Total macros including all added items
        analysisResult,
        photoUrl,
      )

      const currentDate = new Date().toISOString().split("T")[0]

      // IMPORTANT: Update today's consumed calories by recalculating totals

      await calculateAndSaveDailyCalories(currentDate, token)

      // Navigate back to dashboard
      router.push("/home")
    } catch (error) {
      console.error("Error tracking meal:", error)
      // Handle error appropriately
    } finally {
      setTracking(false)
    }
  }, [analysisResult, currentDayNutrition, router])

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
  const currentMacros =
    hasEditedQuantity && updatedMacros ? updatedMacros : analysisResult?.data?.totalMacros || defaultMacros

  if (isEmptyProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full mx-auto shadow-sm border border-border bg-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary rounded-full" />
            </div>
            <CardTitle className="text-xl font-semibold text-card-foreground">Create Profile</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Create your profile to personalize your experience and track your preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Link href="/profile" className="block">
              <Button className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                Create Profile
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-4">Takes less than 2 minutes to set up</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {showSafariWarning && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm p-3">
          <div className="flex items-center justify-between text-white text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-xs">!</span>
              </div>
              <span>Safari doesn't support voice recognition. Use camera instead.</span>
            </div>
            <button onClick={() => setShowSafariWarning(false)} className="text-white/80 hover:text-white">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      <div className="absolute inset-0 z-0">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {isListening ? <VoiceAnimation /> : <ScanningFrame />}

      {/* Flash overlay */}
      {flash ? <div className="pointer-events-none absolute inset-0 z-40 bg-white/90" /> : null}

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
        }}
      >
        <div className="relative flex flex-col items-center">
          <CameraNavBar
            onEditClick={openManualCard}
            onMicClick={isListening ? stopListening : startListening}
            isMicOff={isListening}
            disabled={
              isCardOpen ||
              uploading ||
              analyzing ||
              extractingState ||
              (isSafari && !("webkitSpeechRecognition" in window))
            }
            onBackClick={() => {
              cleanupCamera()
              router.push("/home")
            }}
          />

          <button
            type="button"
            aria-label={isListening ? "Stop listening" : "Take photo or start voice"}
            onClick={isListening ? stopListening : capturePhoto}
            disabled={
              isCardOpen ||
              uploading ||
              analyzing ||
              extractingState ||
              (isSafari && !("webkitSpeechRecognition" in window))
            }
            aria-disabled={isCardOpen || uploading || analyzing || extractingState}
            className="group relative h-20 w-20 select-none rounded-full border-4 border-white/40 bg-white/20 shadow-2xl backdrop-blur-xl transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-white/30 hover:border-white/50"
          >
            {/* Enhanced circular progress for upload */}
            {uploading && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgb(34, 197, 94)"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                  className="transition-all duration-300 drop-shadow-lg"
                />
              </svg>
            )}

            {/* Enhanced circular progress for analysis */}
            {(analyzing || extractingState) && (
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="6" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  className="animate-spin drop-shadow-lg"
                  style={{
                    strokeDashoffset: `${2 * Math.PI * 44 * 0.75}`,
                  }}
                />
              </svg>
            )}

            <span className="absolute inset-3 rounded-full bg-white transition-all duration-200 group-active:scale-95 shadow-xl" />
            <span className="absolute inset-0 grid place-items-center" />
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-500 ease-out ${
          isCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 rounded-t-3xl shadow-2xl">
          <div className="relative flex items-center px-6 pt-6 pb-4">
            <div
              className="absolute left-1/2 top-4 h-1 w-12 -translate-x-1/2 bg-muted-foreground/40 rounded-full"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close"
              onClick={closeCard}
              className="ml-auto inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pb-8">
            {uploading ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <LoadingState type="upload" progress={progress} message="Uploading your photo..." />
              </div>
            ) : analyzing ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <LoadingState type="analyze" message="Analyzing nutrition..." />
              </div>
            ) : extractingState ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <LoadingState
                  type="voice"
                  message={voiceText ? "Processing voice input and scanning food..." : "Processing voice input..."}
                />
              </div>
            ) : uploadError || analysisError || extractionError || voiceError ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="space-y-8 w-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
                      <div className="w-8 h-8 bg-destructive rounded-full" />
                    </div>
                    <h3 className="text-xl font-semibold text-destructive mb-3">
                      {uploadError
                        ? "Upload Failed"
                        : analysisError
                          ? "Analysis Failed"
                          : extractionError || voiceError
                            ? "Voice Processing Failed"
                            : isSafari
                              ? "Safari Not Supported"
                              : "Voice Recognition Failed"}
                    </h3>
                    <p className="text-base text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
                      {uploadError
                        ? "We couldn't upload your image. Please check your connection and try again."
                        : analysisError
                          ? "We couldn't analyze your food. Please try taking another photo or enter the details manually."
                          : extractionError || voiceError
                            ? "We couldn't process your voice input. Please try speaking again or enter the details manually."
                            : isSafari
                              ? "Voice recognition is not supported in Safari. Please use the camera to take a photo instead."
                              : "Something went wrong. Please try again."}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Button
                      onClick={handleRetry}
                      className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
                      disabled={uploading || analyzing || extractingState}
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        closeCard()
                        openManualCard()
                      }}
                      className="w-full h-12 border border-border hover:bg-muted"
                    >
                      Enter Manually Instead
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 pt-4">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <div className="w-10 h-10 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-card-foreground mb-2">{currentFood.name}</h3>
                    <div className="flex items-center justify-center gap-3">
                      <p className="text-lg text-muted-foreground">
                        {hasEditedQuantity ? editedQuantity : currentFood.quantity}
                      </p>
                      {!hasEditedQuantity && !isEditingQuantity && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditQuantity}
                          className="h-8 px-3 text-sm text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          Edit
                        </Button>
                      )}
                      {hasEditedQuantity && (
                        <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full font-medium">
                          Updated
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isEditingQuantity && (
                  <div className="space-y-6 p-6 bg-muted rounded-lg border border-border">
                    <div className="space-y-3">
                      <Label htmlFor="edit-quantity" className="text-base font-medium text-card-foreground">
                        Update Quantity
                      </Label>
                      <Input
                        id="edit-quantity"
                        placeholder="e.g. 200g, 1 cup, 2 pieces"
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(e.target.value)}
                        className="h-12 bg-input border-border focus:ring-2 focus:ring-ring"
                        disabled={isUpdatingMacros}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleUpdateMacros}
                        disabled={!editedQuantity.trim() || isUpdatingMacros}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {isUpdatingMacros ? "Updating..." : "Update Macros"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isUpdatingMacros}
                        className="h-12 px-6 border-border bg-transparent"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-card-foreground text-center">Nutritional Information</h4>
                  {isUpdatingMacros ? (
                    <div className="grid grid-cols-2 gap-4">
                      <EnhancedMacro label="Calories" value={0} unit="kcal" isLoading />
                      <EnhancedMacro label="Protein" value={0} unit="g" isLoading />
                      <EnhancedMacro label="Carbs" value={0} unit="g" isLoading />
                      <EnhancedMacro label="Fat" value={0} unit="g" isLoading />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <EnhancedMacro label="Calories" value={currentMacros.calories} unit="kcal" />
                      <EnhancedMacro label="Protein" value={currentMacros.protein} unit="g" />
                      <EnhancedMacro label="Carbs" value={currentMacros.carbs} unit="g" />
                      <EnhancedMacro label="Fat" value={currentMacros.fat} unit="g" />
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 h-14 bg-white hover:bg-white text-black shadow-sm text-base font-medium rounded-xl transition-all duration-200"
                      onClick={handleAddMeal}
                      disabled={isEditingQuantity || isUpdatingMacros || tracking}
                    >
                      {tracking ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Adding...
                        </div>
                      ) : (
                        "Add this meal"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="flex-1 h-14 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm text-base font-medium rounded-xl transition-all duration-200 bg-transparent"
                      onClick={handleViewFullAnalysis}
                      disabled={isEditingQuantity || isUpdatingMacros || tracking}
                    >
                      Insights
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-x-0 bottom-0 z-30 transform transition-transform duration-500 ease-out ${
          isManualCardOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="bg-background/95 backdrop-blur-xl border-t border-border/50 rounded-t-3xl shadow-2xl">
          <div className="relative flex items-center px-6 pt-6 pb-4">
            <div
              className="absolute left-1/2 top-4 h-1 w-12 -translate-x-1/2 bg-muted-foreground/40 rounded-full"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label="Close manual entry"
              onClick={closeManualCard}
              className="ml-auto inline-flex items-center justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 pb-8">
            <div className="mx-auto">
              <div className="flex flex-col justify-center h-full space-y-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                    <div className="w-10 h-10 bg-primary rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-3">Enter Food Manually</h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      Tell us what you're eating and we'll analyze it for you
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="manual-food" className="text-base font-medium text-card-foreground">
                      What are you eating?
                    </Label>
                    <Input
                      id="manual-food"
                      placeholder="e.g. Grilled Chicken Breast"
                      value={manualFoodName}
                      onChange={(e: any) => setManualFoodName(e.target.value)}
                      className="h-12 bg-input border-border focus:ring-2 focus:ring-ring"
                      disabled={analyzing}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="manual-qty" className="text-base font-medium text-card-foreground">
                      Quantity
                    </Label>
                    <Input
                      id="manual-qty"
                      placeholder="e.g. 200g, 1 cup, 1 medium"
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(e.target.value)}
                      className="h-12 bg-input border-border focus:ring-2 focus:ring-ring"
                      disabled={analyzing}
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm text-base font-medium"
                      onClick={handleManualAnalysis}
                      disabled={!manualFoodName.trim() || !manualQuantity.trim() || analyzing}
                    >
                      {analyzing ? "Analyzing..." : "Analyze Food"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(200px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
