import { apiClient } from "./client";
import type {
  CreateProductPayload,
  PaginatedProducts,
  Product,
  ProductsQuery,
  UpdateProductPayload,
} from "@/lib/types";

export async function listProducts(query: ProductsQuery = {}) {
  const { data } = await apiClient.get<PaginatedProducts>("/products", { params: query });
  return data;
}

/**
 * Pages that need the whole catalog client-side (seller's own listings, admin product
 * management) rather than one page at a time — there's no server-side "mine only" filter,
 * so this walks every page at the max page size and concatenates them.
 */
export async function listAllProducts(query: Omit<ProductsQuery, "page" | "limit"> = {}) {
  const limit = 100;
  const first = await listProducts({ ...query, page: 1, limit });
  const pages = [first.data];

  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const next = await listProducts({ ...query, page, limit });
    pages.push(next.data);
  }

  return pages.flat();
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
