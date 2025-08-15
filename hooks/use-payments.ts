/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import { api } from "@/lib/api"; // <-- your axios instance

interface VerifyPaymentResult {
  success: boolean;
  userId: string;
  paymentId: string;
  paymentData?: any;
}

export function useVerifyPayment() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<VerifyPaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifyPayment = useCallback(async (paymentId: string, userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<VerifyPaymentResult>("/payments", {
        paymentId,
        userId,
      });

      setData(res.data);
      return res.data;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, verifyPayment };
}
