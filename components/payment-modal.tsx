"use client"
import { X, CheckCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useUserSubscriptions } from "@/hooks/use-user"

interface PaymentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PaymentDetailsModal({ isOpen, onClose }: PaymentDetailsModalProps) {
  const { subscriptions:allSubscriptions, loading } = useUserSubscriptions()
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getPlanPrice = (plan: string) => {
    const prices = {
      basic: { amount: 9.99, currency: "USD" },
      pro: { amount: 19.99, currency: "USD" },
      creator: { amount: 39.99, currency: "USD" },
    }
    return prices[plan as keyof typeof prices] || { amount: 0, currency: "USD" }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="flex min-h-screen items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          className={cn(
            "w-full max-w-lg transform overflow-hidden bg-background shadow-2xl transition-all",
            "rounded-t-3xl sm:rounded-3xl",
            "max-h-[90vh] sm:max-h-[85vh]",
          )}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Subscription Plans</h2>
                <p className="text-sm text-muted-foreground mt-1">View all your subscription history</p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-muted">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="overflow-y-auto px-6 pb-6 max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-120px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : allSubscriptions && allSubscriptions.length > 0 ? (
              <div className="space-y-3">
                {allSubscriptions.map((subscription) => {
                  const isActive = subscription.status === "active"
                  const price = getPlanPrice(subscription.plan)

                  return (
                    <Card
                      key={subscription.id}
                      className={cn(
                        "transition-all duration-200",
                        isActive
                          ? "border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          : "border-border/30 bg-muted/30 opacity-75",
                      )}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn("rounded-full p-2", isActive ? "bg-primary/10" : "bg-muted-foreground/10")}
                            >
                              {isActive ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-base font-semibold capitalize",
                                  isActive ? "text-foreground" : "text-muted-foreground",
                                )}
                              >
                                {subscription.plan} Plan
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Started: {formatDate(subscription.start_date)}
                              </p>
                              {subscription.end_date && (
                                <p className="text-sm text-muted-foreground">
                                  {isActive ? "Next billing" : "Ended"}: {formatDate(subscription.end_date)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-lg font-bold",
                                isActive ? "text-foreground" : "text-muted-foreground",
                              )}
                            >
                              {formatCurrency(price.amount, price.currency)}
                            </p>
                            <p className="text-xs text-muted-foreground mb-2">/month</p>
                            <span
                              className={cn(
                                "text-xs px-3 py-1 rounded-full font-medium",
                                isActive
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                              )}
                            >
                              {isActive ? "Active" : "Expired"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="rounded-full bg-muted p-4 w-16 h-16 mx-auto mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No subscriptions found</h3>
                <p className="text-sm text-muted-foreground mb-6">You don&apos;t have any subscription history yet.</p>
                <Button onClick={onClose}>Explore plans</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
