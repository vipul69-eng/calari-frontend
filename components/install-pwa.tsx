"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Smartphone, Share, Plus, Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export const InstallButton = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setIsInstallable(false)
      console.log(`User response to the install prompt: ${outcome}`)
    }
  }

  return (
    <>
      {isInstallable && (
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        >
          <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
          <Smartphone className="mr-2 h-4 w-4 opacity-70" />
          Install App
        </Button>
      )}
    </>
  )
}

export const IOSInstallInstructions = () => {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches

    setIsIOS(isIOSDevice)
    setIsStandalone(isInStandaloneMode)
  }, [])

  if (!isIOS || isStandalone) return null

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-lg backdrop-blur-sm max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 mr-3">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-lg">Install Calari on your iPhone</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start p-3 rounded-lg bg-background/50 border border-primary/10">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mr-3 mt-0.5">
              1
            </span>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Tap the share button</p>
              <div className="flex items-center mt-1">
                <Share className="h-4 w-4 text-primary mr-1" />
                <span className="text-xs text-muted-foreground">at the bottom of Safari</span>
              </div>
            </div>
          </div>

          <div className="flex items-start p-3 rounded-lg bg-background/50 border border-primary/10">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mr-3 mt-0.5">
              2
            </span>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Select &quot;Add to Home Screen&quot;</p>
              <p className="text-xs text-muted-foreground mt-1">Scroll down to find this option</p>
            </div>
          </div>

          <div className="flex items-start p-3 rounded-lg bg-background/50 border border-primary/10">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mr-3 mt-0.5">
              3
            </span>
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Tap &quot;Add&quot; to install</p>
              <p className="text-xs text-muted-foreground mt-1">Calari will appear on your home screen</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-xs text-center text-primary font-medium">
            ✨ Get the full app experience with offline access and faster loading
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
