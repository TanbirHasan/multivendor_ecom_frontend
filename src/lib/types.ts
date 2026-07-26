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
  /** null (not 0) when reviewCount is 0 — distinguishes "no ratings yet" from "rated zero". */
  averageRating: number | null;
  reviewCount: number;
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

export type ProductSortBy = "price" | "createdAt" | "name";
export type SortOrder = "asc" | "desc";

export interface ProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortBy;
  order?: SortOrder;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedProducts {
  data: Product[];
  pagination: PaginationMeta;
}

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

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED";
export type PaymentProvider = "STRIPE" | "SSLCOMMERZ";

export interface Payment {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  providerTransactionId: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  buyerId: string;
  status: OrderStatus;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  payment?: Payment;
}

export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  provider?: PaymentProvider;
}

export interface CheckoutResponseStripe {
  order: Order;
  clientSecret: string;
}

export interface CheckoutResponseSslcommerz {
  order: Order;
  gatewayPageUrl: string;
}

export type CheckoutResponse = CheckoutResponseStripe | CheckoutResponseSslcommerz;

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  productId: string;
  buyerId: string;
  createdAt: string;
  updatedAt: string;
  buyer: { id: string; name: string };
}

export interface ReviewPayload {
  productId: string;
  rating: number;
  comment?: string;
}

export interface BestSellingProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: string;
}

export interface SellerStats {
  totalRevenue: string;
  totalOrders: number;
  totalItemsSold: number;
  bestSellingProducts: BestSellingProduct[];
}
