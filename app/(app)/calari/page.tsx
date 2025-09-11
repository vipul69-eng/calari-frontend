"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/store";
import { OuterLoading } from "@/components/ui/loading";

export default function AppIndexPage() {
  const router = useRouter();
  const user = useCurrentUser();
  useEffect(() => {
    // Example: redirect based on condition
    if (!user) {
      router.replace("/profile");
    } else {
      router.replace("/home");
    }
  }, [router]);

  return <OuterLoading></OuterLoading>; // nothing rendered, just redirects
}
