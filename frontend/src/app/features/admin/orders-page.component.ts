import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { OrderStatus, OrderSummary } from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";
import { orderStatusLabel, orderStatusTone } from "../../core/utils/status";

@Component({
  selector: "app-admin-orders-page",
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Order Queue</p>
            <h2>Track and move orders</h2>
          </div>
          <label class="field field-compact">
            <span>Status</span>
            <select class="input" name="status" [(ngModel)]="statusFilter" (ngModelChange)="loadOrders()">
              <option value="">All statuses</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ orderStatusLabel(status) }}</option>
              }
            </select>
          </label>
        </header>

        <div class="stack-list">
          @for (order of orders(); track order.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <p class="eyebrow">{{ order.orderNumber }}</p>
                  <h3>{{ order.user?.firstName }} {{ order.user?.lastName }}</h3>
                </div>
                <span class="badge" [class]="orderStatusTone(order.status)">
                  {{ orderStatusLabel(order.status) }}
                </span>
              </div>
              <div class="metrics-row">
                <span>{{ order.createdAt | date: "medium" }}</span>
                <strong>{{ priceOf(order.grandTotal) | currency: "THB" : "symbol-narrow" }}</strong>
              </div>
              <button type="button" class="ghost-button" (click)="selectOrder(order.id)">
                Inspect order
              </button>
            </article>
          }
        </div>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Selected order</p>
            <h2>{{ selectedOrder()?.orderNumber || "Choose an order" }}</h2>
          </div>
        </header>

        @if (!selectedOrder()) {
          <div class="empty-panel">Pick an order from the queue to review its detail and status actions.</div>
        } @else {
          <div class="stack-list">
            <article class="list-card">
              <div class="summary-row">
                <span>Customer</span>
                <strong>{{ selectedOrder()!.user?.email }}</strong>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <strong>{{ selectedOrder()!.shippingAddress }}</strong>
              </div>
            </article>

            @for (item of selectedOrder()!.items; track item.id) {
              <article class="list-card">
                <div class="summary-row">
                  <span>{{ item.productName }} × {{ item.quantity }}</span>
                  <strong>{{ priceOf(item.lineTotal) | currency: "THB" : "symbol-narrow" }}</strong>
                </div>
              </article>
            }

            <div class="toolbar-actions">
              @for (status of availableTransitions(selectedOrder()!.status); track status) {
                <button type="button" class="primary-button" (click)="updateStatus(status)">
                  Move to {{ orderStatusLabel(status) }}
                </button>
              }
            </div>
          </div>
        }
      </article>
    </section>
  `,
})
export class OrdersPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly orders = signal<OrderSummary[]>([]);
  protected readonly selectedOrder = signal<OrderSummary | null>(null);
  protected readonly statuses: OrderStatus[] = [
    "PENDING_PAYMENT",
    "WAITING_PAYMENT_REVIEW",
    "PAYMENT_REJECTED",
    "CONFIRMED",
    "PREPARING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusTone = orderStatusTone;
  protected statusFilter: OrderStatus | "" = "";

  constructor() {
    void this.loadOrders();
  }

  protected availableTransitions(status: OrderStatus): OrderStatus[] {
    switch (status) {
      case "PENDING_PAYMENT":
      case "WAITING_PAYMENT_REVIEW":
      case "PAYMENT_REJECTED":
        return ["CANCELLED"];
      case "CONFIRMED":
        return ["PREPARING", "CANCELLED"];
      case "PREPARING":
        return ["SHIPPED", "CANCELLED"];
      case "SHIPPED":
        return ["DELIVERED"];
      default:
        return [];
    }
  }

  protected async selectOrder(orderId: string): Promise<void> {
    try {
      const order = await firstValueFrom(this.adminService.getOrder(orderId));
      this.selectedOrder.set(order);
    } catch {
      this.toast.show("Unable to load order detail.", "error");
    }
  }

  protected async updateStatus(status: OrderStatus): Promise<void> {
    const selectedOrder = this.selectedOrder();
    if (!selectedOrder) {
      return;
    }

    try {
      const order = await firstValueFrom(
        this.adminService.updateOrderStatus(selectedOrder.id, status),
      );
      this.selectedOrder.set(order);
      this.toast.show(`Order moved to ${orderStatusLabel(status)}`, "success");
      await this.loadOrders();
    } catch {
      this.toast.show("Unable to update order status.", "error");
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  protected async loadOrders(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.adminService.getOrders({
          limit: 30,
          status: this.statusFilter || undefined,
        }),
      );
      this.orders.set(result.items);
    } catch {
      this.toast.show("Unable to load orders.", "error");
    }
  }
}
