/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useVerifyPayment } from "@/hooks/use-payments";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Separate component that uses useSearchParams
function PaymentVerification() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyPayment, loading, data, error } = useVerifyPayment();

  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "verifying" | "success" | "error"
  >("idle");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");

    if (paymentId && status === "succeeded") {
      const userId = localStorage.getItem("dodo-user-calari");

      if (userId) {
        setVerificationStatus("verifying");
        handlePaymentVerification(paymentId, userId);
      } else {
        setVerificationStatus("error");
      }
    } else {
      setVerificationStatus("error");
    }
  }, []);

  const handlePaymentVerification = async (
    paymentId: string,
    userId: string,
  ) => {
    try {
      const result = await verifyPayment(paymentId, userId);

      if (result && result.success) {
        setVerificationStatus("success");
        startRedirectCountdown();
      } else {
        setVerificationStatus("error");
      }
    } catch (err) {
      setVerificationStatus("error");
    }
  };

  const startRedirectCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "https://calari.in";
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetry = () => {
    const paymentId = searchParams.get("payment_id");
    const userId = localStorage.getItem("dodo-user-calari");

    if (paymentId && userId) {
      setVerificationStatus("verifying");
      handlePaymentVerification(paymentId, userId);
    }
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "verifying":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading text-foreground">
                Verifying Payment
              </h2>
              <p className="text-muted-foreground">
                Please wait while we confirm your payment...
              </p>
              <div className="w-full bg-muted/30 rounded-full h-1 mt-4">
                <div
                  className="bg-primary h-1 rounded-full animate-pulse"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 h-16 w-16 bg-green-100 rounded-full animate-ping opacity-75" />
                <CheckCircle className="relative h-16 w-16 text-green-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-heading text-foreground">
                Payment Successful!
              </h2>
              <p className="text-muted-foreground">
                Your payment has been verified successfully.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm font-medium text-green-700">
                  Verification Complete
                </p>
              </div>
              <p className="text-sm text-green-600">
                Redirecting to home page in {countdown} seconds...
              </p>
            </div>
            {data && (
              <div className="text-left bg-muted/30 rounded-lg p-4 space-y-3">
                <h3 className="font-heading text-foreground">
                  Payment Details
                </h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span>Payment ID:</span>
                    <span className="font-mono text-xs">{data.paymentId}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 h-16 w-16 bg-red-100 rounded-full animate-pulse opacity-75" />
                <XCircle className="relative h-16 w-16 text-red-500" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-heading text-foreground">
                Payment Verification Failed
              </h2>
              <p className="text-muted-foreground">
                {error ||
                  "There was an issue verifying your payment. Please try again."}
              </p>
            </div>
            <div className="space-y-3">
              <Button className="w-full h-12">
                Contact admin@polygot.tech
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-heading text-foreground">
                Invalid Payment Link
              </h2>
              <p className="text-muted-foreground">
                This payment link is invalid or has expired.
              </p>
            </div>
            <Button onClick={() => router.push("/")} className="w-full h-12">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="w-full max-w-md border-border bg-card shadow-lg">
      <CardContent className="p-8">{renderContent()}</CardContent>
    </Card>
  );
}

// Loading fallback component
function PaymentLoadingFallback() {
  return (
    <Card className="w-full max-w-md border-border bg-card shadow-lg">
      <CardContent className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-heading text-foreground">
              Loading Payment Status
            </h2>
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main page component
export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={<PaymentLoadingFallback />}>
        <PaymentVerification />
      </Suspense>
    </main>
  );
}
