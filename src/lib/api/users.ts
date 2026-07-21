import { apiClient } from "./client";
import type { User, UpdateUserPayload } from "@/lib/types";

export async function listUsers() {
  const { data } = await apiClient.get<User[]>("/users");
  return data;
}

export async function getUser(id: string) {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  const { data } = await apiClient.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/users/${id}`);
}
