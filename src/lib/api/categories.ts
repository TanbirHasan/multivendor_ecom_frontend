import { apiClient } from "./client";
import type { Category } from "@/lib/types";

export async function listCategories() {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function getCategory(id: string) {
  const { data } = await apiClient.get<Category>(`/categories/${id}`);
  return data;
}

export async function createCategory(name: string) {
  const { data } = await apiClient.post<Category>("/categories", { name });
  return data;
}

export async function updateCategory(id: string, name: string) {
  const { data } = await apiClient.put<Category>(`/categories/${id}`, { name });
  return data;
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`/categories/${id}`);
}
