"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { refreshRequest } from "@/lib/api/auth";
import { getUser } from "@/lib/api/users";
import { decodeJwtPayload } from "@/lib/utils";

interface JwtPayload {
  id?: string;
  sub?: string;
  userId?: string;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function restoreSession() {
      try {
        const { accessToken } = await refreshRequest();
        useAuthStore.getState().setAccessToken(accessToken);

        const payload = decodeJwtPayload<JwtPayload>(accessToken);
        const id = payload?.id ?? payload?.sub ?? payload?.userId;
        if (id) {
          const user = await getUser(id);
          useAuthStore.getState().setUser(user);
        } else {
          useAuthStore.getState().clearAuth();
        }
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().finishInitializing();
      }
    }

    restoreSession();
  }, []);

  return <>{children}</>;
}
