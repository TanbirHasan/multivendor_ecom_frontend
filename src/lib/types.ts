export type Role = "BUYER" | "SELLER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  sellerId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  message: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: "BUYER" | "SELLER";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: Role;
}

export type OrderStatus = "PLACED" | "CANCELLED";
export type OrderItemStatus = "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sellerId: string;
  quantity: number;
  priceAtPurchase: string;
  status: OrderItemStatus;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; name: string };
  order?: { id: string; status: OrderStatus; buyerId: string; createdAt: string };
}

export interface Order {
  id: string;
  buyerId: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
}
