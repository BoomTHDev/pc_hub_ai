import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import type { PaginatedData } from "../models/api.models";
import type {
  Brand,
  Category,
  InventoryTransaction,
  InventoryTransactionType,
  OrderStatus,
  OrderSummary,
  PaymentDetail,
  PaymentMethod,
  PaymentStatus,
  ProductAttribute,
  ProductCard,
  ProductDetail,
  UserProfile,
} from "../models/domain.models";
import { ApiClientService } from "./api-client.service";
import type { ProductFilters } from "./catalog.service";

export interface ProductPayload {
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQty: number;
  isActive: boolean;
  categoryId: string;
  brandId: string;
  attributes?: ProductAttribute[];
}

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private readonly api = inject(ApiClientService);

  getProducts(filters: ProductFilters = {}): Observable<PaginatedData<ProductCard>> {
    return this.api.getPaginated<ProductCard>("/products", filters);
  }

  getProduct(productId: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${productId}`);
  }

  createProduct(payload: ProductPayload): Observable<ProductDetail> {
    return this.api.post<ProductDetail>("/products", payload);
  }

  updateProduct(productId: string, payload: Partial<ProductPayload>): Observable<ProductDetail> {
    return this.api.put<ProductDetail>(`/products/${productId}`, payload);
  }

  deleteProduct(productId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/products/${productId}`);
  }

  uploadProductImage(
    productId: string,
    file: File,
    isPrimary: boolean,
  ): Observable<object> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("isPrimary", String(isPrimary));
    return this.api.post<object>(`/products/${productId}/images`, formData);
  }

  updateProductAttributes(
    productId: string,
    attributes: ProductAttribute[],
  ): Observable<ProductAttribute[]> {
    return this.api.put<ProductAttribute[]>(
      `/products/${productId}/attributes`,
      { attributes },
    );
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>("/categories");
  }

  createCategory(payload: {
    name: string;
    description?: string;
  }): Observable<Category> {
    return this.api.post<Category>("/categories", payload);
  }

  updateCategory(
    categoryId: string,
    payload: { name?: string; description?: string | null },
  ): Observable<Category> {
    return this.api.put<Category>(`/categories/${categoryId}`, payload);
  }

  deleteCategory(categoryId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/categories/${categoryId}`);
  }

  getBrands(): Observable<Brand[]> {
    return this.api.get<Brand[]>("/brands");
  }

  createBrand(payload: {
    name: string;
    description?: string;
    website?: string;
  }): Observable<Brand> {
    return this.api.post<Brand>("/brands", payload);
  }

  updateBrand(
    brandId: string,
    payload: { name?: string; description?: string | null; website?: string | null },
  ): Observable<Brand> {
    return this.api.put<Brand>(`/brands/${brandId}`, payload);
  }

  deleteBrand(brandId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/brands/${brandId}`);
  }

  getOrders(query?: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }): Observable<PaginatedData<OrderSummary>> {
    return this.api.getPaginated<OrderSummary>("/orders", query);
  }

  getOrder(orderId: string): Observable<OrderSummary> {
    return this.api.get<OrderSummary>(`/orders/${orderId}`);
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Observable<OrderSummary> {
    return this.api.patch<OrderSummary>(`/orders/${orderId}/status`, { status });
  }

  getPayments(query?: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    method?: PaymentMethod;
  }): Observable<PaginatedData<PaymentDetail>> {
    return this.api.getPaginated<PaymentDetail>("/payments", query);
  }

  getPayment(paymentId: string): Observable<PaymentDetail> {
    return this.api.get<PaymentDetail>(`/payments/${paymentId}`);
  }

  reviewPayment(
    paymentId: string,
    action: "APPROVE" | "REJECT",
    reviewNote?: string,
  ): Observable<PaymentDetail> {
    return this.api.post<PaymentDetail>(`/payments/${paymentId}/review`, {
      action,
      reviewNote,
    });
  }

  markCodPaid(paymentId: string, note?: string): Observable<PaymentDetail> {
    return this.api.post<PaymentDetail>(`/payments/${paymentId}/cod-paid`, {
      note,
    });
  }

  getInventory(query?: {
    page?: number;
    limit?: number;
    productId?: string;
    type?: InventoryTransactionType;
  }): Observable<PaginatedData<InventoryTransaction>> {
    return this.api.getPaginated<InventoryTransaction>("/inventory", query);
  }

  getLowStock(
    threshold = 10,
  ): Observable<Array<Pick<ProductCard, "id" | "sku" | "name" | "stockQty">>> {
    return this.api.get<Array<Pick<ProductCard, "id" | "sku" | "name" | "stockQty">>>(
      "/inventory/low-stock",
      { threshold },
    );
  }

  createInventoryTransaction(payload: {
    productId: string;
    type: Exclude<InventoryTransactionType, "SALE">;
    quantity: number;
    note?: string;
  }): Observable<InventoryTransaction> {
    return this.api.post<InventoryTransaction>("/inventory", payload);
  }

  getUsers(query?: {
    page?: number;
    limit?: number;
    role?: "ADMIN" | "STAFF" | "CUSTOMER";
  }): Observable<PaginatedData<UserProfile>> {
    return this.api.getPaginated<UserProfile>("/users", query);
  }

  toggleUserActive(userId: string, isActive: boolean): Observable<UserProfile> {
    return this.api.patch<UserProfile>(`/users/${userId}/active`, { isActive });
  }
}
