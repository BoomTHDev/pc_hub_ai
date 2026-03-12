import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { OrderStatus, OrderSummary } from "../../core/models/domain.models";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";
import { orderStatusLabel, orderStatusTone } from "../../core/utils/status";

@Component({
  selector: "app-orders-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <section class="panel">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Orders</p>
          <h1>Your purchase timeline</h1>
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

      @if (loading()) {
        <div class="empty-panel">Loading orders...</div>
      } @else if (!orders().length) {
        <div class="empty-panel">No orders found yet.</div>
      } @else {
        <div class="stack-list">
          @for (order of orders(); track order.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <p class="eyebrow">{{ order.orderNumber }}</p>
                  <h2>{{ order.recipientName }}</h2>
                </div>
                <span class="badge" [class]="orderStatusTone(order.status)">
                  {{ orderStatusLabel(order.status) }}
                </span>
              </div>

              <div class="metrics-row">
                <span>{{ order.createdAt | date: "medium" }}</span>
                <strong>{{ priceOf(order.grandTotal) | currency: "THB" : "symbol-narrow" }}</strong>
              </div>

              <div class="summary-row">
                <span>{{ order.items.length }} line items</span>
                <a [routerLink]="['/orders', order.id]" class="ghost-button">View details</a>
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class OrdersPageComponent {
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly orders = signal<OrderSummary[]>([]);
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
  protected statusFilter = "";
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusTone = orderStatusTone;

  constructor() {
    void this.loadOrders();
  }

  protected async loadOrders(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await firstValueFrom(
        this.customerService.getMyOrders({
          limit: 20,
          status: this.statusFilter || undefined,
        }),
      );
      this.orders.set(result.items);
    } catch {
      this.toast.show("Unable to load order history.", "error");
    } finally {
      this.loading.set(false);
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }
}
