/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { AxiosError } from "axios";
import { api } from "@/lib/api"; // your axios instance
import { useUserStore, } from "@/store/user-store";
import { useAuth } from "@clerk/nextjs";
import { Plan, User, UserProfile } from "@/types/store";

export interface UpsertUserPayload {
  email: string;
  plan?: Plan;
  profile?: UserProfile;
}

/**
 * Hook for creating/updating a user
 */
export function useUpsertUser() {
  const {getToken} = useAuth()
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<User | null>(null);
  const setUser = useUserStore((state) => state.setUser);

  const upsertUser = useCallback(async (payload: UpsertUserPayload) => {
    const token = await getToken() 
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<User>("/users", payload, {
        headers:{
          Authorization:`Bearer ${token}`
        }
      });
      setData(res.data);
      setUser(res.data); // persist in store
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr.response?.data?.error || axiosErr.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUser]);

  return { upsertUser, data, loading, error };
}

/**
 * Hook for fetching a user by email and persisting it
 */
export function useGetUser(email?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<User | null>(null);
  const fetchedRef = useRef<string | null>(null); // Track what we've fetched
    const {getToken} = useAuth()


  const setUser = useUserStore((state) => state.setUser);
  const savedUser = useUserStore((state) => state.user);

  useEffect(() => {
    if (!email) return;
    
    // Skip if we already fetched this email
    if (fetchedRef.current === email) {
      if (savedUser && savedUser.email === email) {
        setData(savedUser);
      }
      return;
    }


    let isMounted = true;
    const fetchUser = async () => {
      const token = await getToken()
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<User>(`/users/${encodeURIComponent(email)}`, 
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
      );

        if (isMounted) {
          setData(res.data);
          setUser(res.data);
          fetchedRef.current = email; // Mark as fetched
        }
      } catch (err) {
        const axiosErr = err as AxiosError<any>;
        if (isMounted) {
          setError(axiosErr.response?.data?.error || axiosErr.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  return { data, loading, error };
}


// Define the subscription type based on your database schema
export interface UserSubscription {
  id: string;
  user_id: string;
  plan: "basic" | "pro" | "creator";
  start_date: string;
  end_date: string;
  status: "active" | "expired";
  created_at: string;
}

interface SubscriptionsResponse {
  subscriptions: UserSubscription[];
}

export function useUserSubscriptions() {
  const { getToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await api.get<SubscriptionsResponse>("/users/subscriptions", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(res.data)
      setSubscriptions(res.data.subscriptions);
    } catch (err) {
      const axiosErr = err as AxiosError<any>;
      setError(axiosErr.response?.data?.error || axiosErr.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  // Get current active subscription
  const activeSubscription = subscriptions?.find(sub => sub.status === "active") || null;

  // Get current plan from active subscription
  const currentPlan = activeSubscription?.plan || null;

  // Check if user has active subscription
  const hasActiveSubscription = !!activeSubscription;

  return { 
    subscriptions, 
    activeSubscription,
    currentPlan,
    hasActiveSubscription,
    loading, 
    error,
    refetch: fetchSubscriptions
  };
}
