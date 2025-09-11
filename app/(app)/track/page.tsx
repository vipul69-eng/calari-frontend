/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/use-upload";
import {
  type FoodAnalysisContext,
  useFoodAnalysis,
  useFoodExtraction,
} from "@/hooks/use-food";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CameraNavBar } from "@/components/nav/camera-nav";
import {
  ScanningFrame,
  VoiceAnimation,
} from "@/components/track/CameraComponents";
import React from "react";
import { useCurrentDayNutrition, useUserStore } from "@/store";
import { Analysis } from "@/components/track/analysis";

export default function CameraPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const [flash, setFlash] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const { user } = useUserStore();
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const [isSafari, setIsSafari] = useState(false);
  const [showSafariWarning, setShowSafariWarning] = useState(false);
  const [, setExtracting] = useState(false); // Declare setExtracting variable

  // Upload and analysis hooks
  const {
    uploadImage,
    uploading,
    progress,
    error: uploadError,
  } = useImageUpload();
  const {
    analyzeImage,
    analyzeText,
    analyzing,
    error: analysisError,
    result: analysisResult,
  } = useFoodAnalysis();
  const {
    extractFood,
    extracting: extractingState,
    error: extractionError,
  } = useFoodExtraction();

  const router = useRouter();
  const currentDayNutrition = useCurrentDayNutrition();

  // Immersive photo overlay state
  const [isPhotoViewOpen, setIsPhotoViewOpen] = React.useState(false);
  const [photoSrc, setPhotoSrc] = React.useState<string | null>(null);

  const closePhotoView = () => {
    setIsPhotoViewOpen(false);
    // allow fade-out before clearing src
    setTimeout(() => setPhotoSrc(null), 180);
  };

  // User context for personalized recommendations
  const userContext: FoodAnalysisContext | undefined = useMemo(
    () =>
      true
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
      user?.profile.profileText,
      user?.profile.macros,
      currentDayNutrition?.totalCalories,
      currentDayNutrition?.totalCarbs,
      currentDayNutrition?.totalProtein,
      currentDayNutrition?.totalFat,
    ],
  );

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafariBrowser =
      /safari/.test(userAgent) &&
      !/chrome/.test(userAgent) &&
      !/chromium/.test(userAgent);
    setIsSafari(isSafariBrowser);

    if (isSafariBrowser && !("webkitSpeechRecognition" in window)) {
      setShowSafariWarning(true);
    }

    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition ||
        (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        handleVoiceResult(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setVoiceError(`Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (voiceText && !analyzing && !uploading) {
          setExtracting(true);
        }
      };
    }
  }, [voiceText, analyzing, uploading]);

  const handleVoiceResult = useCallback(
    async (transcript: string) => {
      try {
        setVoiceError(null);
        const extractedFood = await extractFood(transcript);
        if (extractedFood) {
          if (extractedFood.quantity) {
            // Has quantity, analyze directly
            await analyzeText(
              extractedFood.name,
              extractedFood.quantity,
              userContext,
            );
            setIsCardOpen(true);
          } else {
            router.push(
              `/manual-entry?food=${encodeURIComponent(extractedFood.name)}`,
            );
          }
        } else {
          setVoiceError("Could not extract food information from voice input");
        }
      } catch (error) {
        setVoiceError("Failed to process voice input");
      }
    },
    [extractFood, analyzeText, userContext, router],
  );

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setVoiceText("");
      setVoiceError(null);
      setIsListening(true);
      recognitionRef.current.start();
      hapticTap();
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (voiceText) {
        setExtracting(true);
      }
    }
  }, [isListening, voiceText]);

  const cleanupCamera = useCallback(() => {
    try {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
    } catch {}
  }, []);

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
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          const playWhenReady = () => {
            video.play().catch(() => {
              // Autoplay might be blocked; will start on first tap
            });
          };
          if (video.readyState >= 2) playWhenReady();
          else video.onloadedmetadata = playWhenReady;
        }
      } catch {}
    };
    startCamera();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cleanupCamera();
      }
    };

    const handleBeforeUnload = () => {
      cleanupCamera();
    };

    const handlePopState = () => {
      cleanupCamera();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      cleanupCamera();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [cleanupCamera]);

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const ensureFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        // @ts-expect-error vendor-prefixed
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      } catch {
        // ignore; layout already covers full screen
      }
    }
  }, []);

  const hapticTap = useCallback(() => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.([10, 20, 10]);
    } catch {
      // ignore
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    await ensureFullscreen();
    const video = videoRef.current;
    if (!video) return;

    hapticTap();
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    setTimeout(() => setIsCardOpen(true), 150);

    const { videoWidth, videoHeight } = video;
    if (!videoWidth || !videoHeight) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        setPhotoUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });

        const file = new File([blob], `food-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        setCapturedFile(file);
        handleUploadAndAnalyze(file);
      },
      "image/jpeg",
      0.92,
    );
  }, [ensureFullscreen, hapticTap]);

  const handleUploadAndAnalyze = useCallback(
    async (file: File) => {
      try {
        const uploadResult = await uploadImage(file);
        await analyzeImage(uploadResult.hostableLink, userContext);
      } catch {}
    },
    [uploadImage, analyzeImage, userContext],
  );

  const closeCard = useCallback(() => {
    setIsCardOpen(false);
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(undefined);
    setCapturedFile(null);
  }, [photoUrl]);

  const openManualCard = useCallback(() => {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(10);
    } catch {}
    router.push("/manual-entry");
  }, [router]);

  const handleRetry = useCallback(() => {
    if (capturedFile) {
      handleUploadAndAnalyze(capturedFile);
    }
  }, [capturedFile, handleUploadAndAnalyze]);

  const profile = user?.profile;
  const isEmptyProfile = useMemo(() => {
    if (!profile) return true;
    if (Object.keys(profile).length === 0) return true;
    if (!profile.name || !profile.age || !profile.macros) return true;
    const macros = profile.macros;
    if (!macros.calories || !macros.protein || !macros.fat || !macros.carbs)
      return true;
    return false;
  }, [profile]);

  if (isEmptyProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full mx-auto shadow-sm border border-border bg-card">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary rounded-full" />
            </div>
            <CardTitle className="text-xl font-semibold text-card-foreground">
              Create Profile
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Create your profile to personalize your experience and track your
              preferences
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Link href="/profile" className="block">
              <Button className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                Create Profile
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Takes less than 2 minutes to set up
            </p>
          </CardContent>
        </Card>
      </div>
    );
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
              <span>
                Safari doesn't support voice recognition. Use camera instead.
              </span>
            </div>
            <button
              onClick={() => setShowSafariWarning(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {isListening ? <VoiceAnimation /> : <ScanningFrame />}

      {/* Flash overlay */}
      {flash ? (
        <div className="pointer-events-none absolute inset-0 z-40 bg-white/90" />
      ) : null}

      <div
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-center"
        style={{
          paddingBottom:
            "calc(env(safe-area-inset-bottom) + var(--bottom-ui, 24px))",
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
              cleanupCamera();
              router.back();
            }}
          />

          <button
            type="button"
            aria-label={
              isListening ? "Stop listening" : "Take photo or start voice"
            }
            onClick={isListening ? stopListening : capturePhoto}
            disabled={
              isCardOpen ||
              uploading ||
              analyzing ||
              extractingState ||
              (isSafari && !("webkitSpeechRecognition" in window))
            }
            aria-disabled={
              isCardOpen || uploading || analyzing || extractingState
            }
            className="group relative h-20 w-20 select-none rounded-full border-4 border-white/40 bg-white/20 shadow-2xl backdrop-blur-xl transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 hover:bg-white/30 hover:border-white/50"
          >
            {/* Enhanced circular progress for upload */}
            {uploading && (
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(34, 197, 94, 0.2)"
                  strokeWidth="6"
                />
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
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(59, 130, 246, 0.2)"
                  strokeWidth="6"
                />
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

      <Analysis
        uploading={uploading}
        analyzing={analyzing}
        extractingState={extractingState}
        uploadError={uploadError}
        analysisError={analysisError}
        extractionError={extractionError}
        voiceError={voiceError}
        voiceText={voiceText}
        progress={progress}
        isSafari={isSafari}
        analysisResult={analysisResult as any}
        isOpen={isCardOpen}
        onClose={closeCard}
        handleRetry={handleRetry}
        openManualCard={openManualCard}
        photoUrl={photoUrl}
        redirectAfterAdd="/home"
        showEditButton={true}
      />

      {/* Immersive photo overlay */}
      {photoSrc && (
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-200 ease-out ${
            isPhotoViewOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!isPhotoViewOpen}
          aria-modal="true"
          role="dialog"
        >
          {/* Backdrop: transparent + blur to keep background visible but softened */}
          <button
            type="button"
            aria-label="Close photo view"
            onClick={closePhotoView}
            className="absolute inset-0 bg-background/30 backdrop-blur-2xl"
          />

          {/* Intentional unclear top border using frosted gradient strip to integrate with the screen */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-background/40 backdrop-blur-2xl" />

          {/* Content container */}
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <div
              className={`relative max-w-[min(92vw,900px)] max-h-[80vh] w-auto overflow-hidden border border-border/50 bg-background/50 shadow-2xl transition-all duration-200 ${
                isPhotoViewOpen ? "scale-100" : "scale-95"
              }`}
            >
              {/* Top gradient to further soften the edge within the content */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-background/60 to-transparent" />

              {/* Image */}
              <img
                src={photoSrc || "/placeholder.svg"}
                alt="Food item photo"
                className="block max-h-[80vh] w-auto object-contain select-none"
                crossOrigin="anonymous"
                draggable={false}
              />

              {/* Controls */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={closePhotoView}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-background/70 hover:bg-background/90 border border-border/60 text-foreground transition-colors"
                  aria-label="Close"
                  title="Close"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ESC to close */}
          <span
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Escape") closePhotoView();
            }}
            className="sr-only"
          >
            Close
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(200px);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
