"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { dashboardPathForRole } from "@/lib/roles";
import { PageSpinner } from "@/components/ui/spinner";

/** Keeps already-logged-in users off guest-only pages (login/register) — sends them to their dashboard instead. */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;
    if (isAuthenticated && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isInitializing, isAuthenticated, user, router]);

  if (isInitializing || (isAuthenticated && user)) {
    return <PageSpinner label="Redirecting…" />;
  }

  return <>{children}</>;
}
