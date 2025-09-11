"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  Crown,
  DollarSign,
  LogOut,
  User,
  ArrowRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@clerk/nextjs";
import { useUpsertUser } from "@/hooks/use-user";
import { PaymentDetailsModal } from "@/components/payment-modal";
import { useUserStore } from "@/store";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const user = useUserStore((state) => state.user);
  const clearUser = useUserStore((state) => state.clearUser);
  useUpsertUser();

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  function haptic(ms = 12) {
    try {
      if ("vibrate" in navigator) navigator.vibrate?.(ms);
    } catch {}
  }

  async function onLogout() {
    haptic(16);
    try {
      await signOut();
      clearUser();
      sessionStorage.clear();
    } catch {}
    router.push("/");
  }

  const onProClicked = () => {
    const url =
      "https://checkout.dodopayments.com/buy/pdt_cjUSGLTRN5sjRyU8MSZPs?quantity=1&redirect_url=https://calari.in%2Fpayments";
    localStorage.setItem("dodo-user-calari", user?.id as string);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2 md:p-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Account Card */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2">
                <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <CardTitle className="text-lg font-semibold">Account</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 border border-border">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {user?.email || "Not signed in"}
                </p>
                <p className="text-sm text-muted-foreground">Account email</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Overview Card */}
        <Card id="payment" className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-semibold">
                  Payment Overview
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/payments")}
                className="text-primary hover:text-primary/80"
              >
                <span className="hidden md:inline">View Details</span>
                <ArrowRight className="h-4 w-4 md:ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 border border-border/50">
              <div>
                <p className="font-medium text-foreground">Current Plan</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {user?.plan || "basic"} Plan
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {user?.plan === "pro" ? "₹199/month" : "Free"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.plan === "pro" ? "Active" : "Limited features"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs bg-transparent"
              onClick={() => setShowPaymentDetails(true)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View Payment Details
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan Upgrade Card */}
        {(user?.plan === "basic" || !user?.plan) && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/20 p-2">
                  <Crown className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Upgrade to Pro
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unlock all features and get unlimited access
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>29 tracks daily</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Profile-based recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>All future pro features</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <span>Priority support</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                <div>
                  <p className="text-2xl font-bold text-foreground">₹199</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <Button
                  onClick={onProClicked}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Actions */}
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <LogOut className="h-4 w-4 md:h-5 md:w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg font-semibold">
                Account Actions
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-popover border-border mx-4">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Are you sure you want to sign out?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    You will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onLogout}
                    className="w-full sm:w-auto"
                  >
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              This won&apos;t delete your account.
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-4">
          {"Calari v0.1.0 • © "}
          {new Date().getFullYear()}
        </div>
      </div>

      <PaymentDetailsModal
        isOpen={showPaymentDetails}
        onClose={() => setShowPaymentDetails(false)}
      />
    </main>
  );
}
