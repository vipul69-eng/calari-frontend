"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useVerifyPayment } from "@/hooks/use-payments"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { verifyPayment, loading, data, error } = useVerifyPayment()

  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "error">("idle")
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const paymentId = searchParams.get("payment_id")
    const status = searchParams.get("status")

    if (paymentId && status === "succeeded") {
      // Get userId from localStorage (matching the pattern from PaymentForm)
      const userId = localStorage.getItem("dodo-user-calari")

      if (userId) {
        setVerificationStatus("verifying")
        handlePaymentVerification(paymentId, userId)
      } else {
        setVerificationStatus("error")
      }
    } else {
      setVerificationStatus("error")
    }
  }, [])

  const handlePaymentVerification = async (paymentId: string, userId: string) => {
    try {
      const result = await verifyPayment(paymentId, userId)

      if (result && result.success) {
        setVerificationStatus("success")
        // Start countdown for redirect
        startRedirectCountdown()
      } else {
        setVerificationStatus("error")
      }
    } catch (err) {
      console.error("Payment verification failed:", err)
      setVerificationStatus("error")
    }
  }

  const startRedirectCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = "http://localhost:3000"
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleRetry = () => {
    const paymentId = searchParams.get("payment_id")
    const userId = localStorage.getItem("dodo-user-calari")

    if (paymentId && userId) {
      setVerificationStatus("verifying")
      handlePaymentVerification(paymentId, userId)
    }
  }

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <h2 className="text-xl font-heading text-foreground">Verifying Payment</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )

      case "success":
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-heading text-foreground">Payment Successful!</h2>
            <p className="text-muted-foreground">Your payment has been verified successfully.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">Redirecting to home page in {countdown} seconds...</p>
            </div>
            {data && (
              <div className="text-left bg-muted/30 rounded-lg p-4 mt-4">
                <h3 className="font-medium text-foreground mb-2">Payment Details:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Payment ID: {data.paymentId}</p>
                </div>
              </div>
            )}
          </div>
        )

      case "error":
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-heading text-foreground">Payment Verification Failed</h2>
            <p className="text-muted-foreground">
              {error || "There was an issue verifying your payment. Please try again."}
            </p>
            <div className="space-y-2">
              <Button onClick={handleRetry} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  "Retry Verification"
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                Return to Home
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-heading text-foreground">Invalid Payment Link</h2>
            <p className="text-muted-foreground">This payment link is invalid or has expired.</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Return to Home
            </Button>
          </div>
        )
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardContent className="p-8">{renderContent()}</CardContent>
      </Card>
    </main>
  )
}
