import { apiClient } from "./client";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/lib/types";

export async function registerRequest(payload: RegisterPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function loginRequest(payload: LoginPayload) {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function refreshRequest() {
  const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");
  return data;
}

export async function logoutRequest() {
  const { data } = await apiClient.post<{ message: string }>("/auth/logout");
  return data;
}
