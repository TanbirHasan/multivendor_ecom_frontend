import { apiClient } from "./client";
import type {
  CreateProductPayload,
  Product,
  UpdateProductPayload,
} from "@/lib/types";

export async function listProducts() {
  const { data } = await apiClient.get<Product[]>("/products");
  return data;
}

export async function getProduct(id: string) {
  const { data } = await apiClient.get<Product>(`/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductPayload) {
  const { data } = await apiClient.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: string, payload: UpdateProductPayload) {
  const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`/products/${id}`);
}
