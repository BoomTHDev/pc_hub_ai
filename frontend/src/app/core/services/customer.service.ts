import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import type { PaginatedData } from "../models/api.models";
import type {
  Address,
  Cart,
  OrderSummary,
  PaymentDetail,
  PaymentMethod,
} from "../models/domain.models";
import { ApiClientService } from "./api-client.service";

export interface AddressPayload {
  type: "HOME" | "WORK" | "OTHER";
  label?: string;
  recipientName: string;
  recipientPhone: string;
  line1: string;
  line2?: string;
  subDistrict?: string;
  district?: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: "root",
})
export class CustomerService {
  private readonly api = inject(ApiClientService);

  getCart(): Observable<Cart> {
    return this.api.get<Cart>("/cart");
  }

  addToCart(productId: string, quantity: number): Observable<Cart> {
    return this.api.post<Cart>("/cart/items", { productId, quantity });
  }

  updateCartItem(productId: string, quantity: number): Observable<Cart> {
    return this.api.put<Cart>(`/cart/items/${productId}`, { quantity });
  }

  removeCartItem(productId: string): Observable<Cart> {
    return this.api.delete<Cart>(`/cart/items/${productId}`);
  }

  clearCart(): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>("/cart/clear");
  }

  getAddresses(): Observable<Address[]> {
    return this.api.get<Address[]>("/users/addresses");
  }

  createAddress(payload: AddressPayload): Observable<Address> {
    return this.api.post<Address>("/users/addresses", payload);
  }

  updateAddress(addressId: string, payload: Partial<AddressPayload>): Observable<Address> {
    return this.api.put<Address>(`/users/addresses/${addressId}`, payload);
  }

  deleteAddress(addressId: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`/users/addresses/${addressId}`);
  }

  checkout(payload: {
    addressId: string;
    paymentMethod: PaymentMethod;
    note?: string;
  }): Observable<OrderSummary> {
    return this.api.post<OrderSummary>("/orders/checkout", payload);
  }

  getMyOrders(query?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<PaginatedData<OrderSummary>> {
    return this.api.getPaginated<OrderSummary>("/orders/my", query);
  }

  getMyOrder(orderId: string): Observable<OrderSummary> {
    return this.api.get<OrderSummary>(`/orders/my/${orderId}`);
  }

  uploadSlip(paymentId: string, file: File): Observable<PaymentDetail> {
    const formData = new FormData();
    formData.append("image", file);
    return this.api.post<PaymentDetail>(`/payments/${paymentId}/slip`, formData);
  }
}
