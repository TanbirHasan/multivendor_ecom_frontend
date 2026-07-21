"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PageSpinner } from "@/components/ui/spinner";
import type { Role } from "@/lib/types";

export function RequireAuth({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (roles && user && !roles.includes(user.role)) {
      router.replace("/");
    }
  }, [isInitializing, isAuthenticated, user, roles, router]);

  if (isInitializing || !isAuthenticated || (roles && user && !roles.includes(user.role))) {
    return <PageSpinner label="Checking your session..." />;
  }

  return <>{children}</>;
}
