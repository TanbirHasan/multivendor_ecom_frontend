"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { loginRequest, logoutRequest, registerRequest } from "@/lib/api/auth";
import type { LoginPayload, RegisterPayload } from "@/lib/types";

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginRequest(payload);
      setAuth(data.user, data.accessToken);
      return data;
    },
    [setAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await registerRequest(payload);
      setAuth(data.user, data.accessToken);
      return data;
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
      // The cart persists to localStorage and isn't scoped to a user — clear it on logout so
      // the next person on this browser doesn't see the previous account's selected items.
      useCartStore.getState().clear();
      useCheckoutStore.getState().clear();
    }
  }, [clearAuth]);

  return {
    user,
    accessToken,
    isAuthenticated: Boolean(user && accessToken),
    isInitializing,
    login,
    register,
    logout,
  };
}
