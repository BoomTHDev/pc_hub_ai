import { CommonModule, CurrencyPipe, DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { OrderSummary } from "../../core/models/domain.models";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";
import {
  orderStatusLabel,
  orderStatusTone,
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from "../../core/utils/status";

@Component({
  selector: "app-order-detail-page",
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    @if (loading()) {
      <div class="empty-panel">Loading order...</div>
    } @else if (!order()) {
      <div class="empty-panel">Unable to load the requested order.</div>
    } @else {
      <section class="detail-grid">
        <article class="panel">
          <header class="section-heading">
            <div>
              <p class="eyebrow">{{ order()!.orderNumber }}</p>
              <h1>Order detail</h1>
            </div>
            <span class="badge" [class]="orderStatusTone(order()!.status)">
              {{ orderStatusLabel(order()!.status) }}
            </span>
          </header>

          <div class="metrics-grid">
            <article class="metric-card">
              <span>Created</span>
              <strong>{{ order()!.createdAt | date: "medium" }}</strong>
            </article>
            <article class="metric-card">
              <span>Total</span>
              <strong>{{ priceOf(order()!.grandTotal) | currency: "THB" : "symbol-narrow" }}</strong>
            </article>
          </div>

          <div class="stack-list">
            @for (item of order()!.items; track item.id) {
              <article class="list-card">
                <div class="summary-row">
                  <span>{{ item.productName }} × {{ item.quantity }}</span>
                  <strong>{{ priceOf(item.lineTotal) | currency: "THB" : "symbol-narrow" }}</strong>
                </div>
              </article>
            }
          </div>
        </article>

        <aside class="stack-column">
          <article class="panel">
            <header class="section-heading">
              <div>
                <p class="eyebrow">Shipping</p>
                <h2>{{ order()!.recipientName }}</h2>
              </div>
            </header>
            <p>{{ order()!.shippingAddress }}</p>
            <p class="support-copy">{{ order()!.recipientPhone }}</p>
          </article>

          @if (order()!.payment) {
            <article class="panel">
              <header class="section-heading">
                <div>
                  <p class="eyebrow">Payment</p>
                  <h2>{{ paymentMethodLabel(order()!.payment!.method) }}</h2>
                </div>
                <span class="badge" [class]="paymentStatusTone(order()!.payment!.status)">
                  {{ paymentStatusLabel(order()!.payment!.status) }}
                </span>
              </header>

              @if (order()!.payment!.slips.length) {
                <img
                  class="receipt-image"
                  [src]="order()!.payment!.slips[0].imageUrl"
                  alt="Payment slip"
                />
              }

              @if (canUploadSlip()) {
                <div class="form-stack">
                  <label class="field">
                    <span>Upload payment slip</span>
                    <input type="file" accept="image/*" (change)="selectFile(filePicker.files)" #filePicker />
                  </label>
                  <button type="button" class="primary-button" (click)="uploadSlip()" [disabled]="uploading()">
                    {{ uploading() ? "Uploading..." : "Submit slip" }}
                  </button>
                </div>
              }

              @if (order()!.payment!.reviewNote) {
                <p class="support-copy">Review note: {{ order()!.payment!.reviewNote }}</p>
              }
            </article>
          }
        </aside>
      </section>
    }
  `,
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly uploading = signal(false);
  protected readonly order = signal<OrderSummary | null>(null);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly orderStatusLabel = orderStatusLabel;
  protected readonly orderStatusTone = orderStatusTone;
  protected readonly paymentMethodLabel = paymentMethodLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly paymentStatusTone = paymentStatusTone;

  constructor() {
    void this.loadOrder();
  }

  protected selectFile(files: FileList | null): void {
    this.selectedFile.set(files?.item(0) ?? null);
  }

  protected canUploadSlip(): boolean {
    const payment = this.order()?.payment;
    return payment?.status === "AWAITING_SLIP" && payment.slips.length === 0;
  }

  protected async uploadSlip(): Promise<void> {
    const payment = this.order()?.payment;
    const file = this.selectedFile();
    if (!payment || !file) {
      this.toast.show("Choose a slip image before uploading.", "error");
      return;
    }

    this.uploading.set(true);
    try {
      await firstValueFrom(this.customerService.uploadSlip(payment.id, file));
      this.toast.show("Slip uploaded for review", "success");
      await this.loadOrder();
    } catch {
      this.toast.show("Unable to upload the slip.", "error");
    } finally {
      this.uploading.set(false);
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  private async loadOrder(): Promise<void> {
    const orderId = this.route.snapshot.paramMap.get("id");
    if (!orderId) {
      return;
    }

    this.loading.set(true);
    try {
      const order = await firstValueFrom(this.customerService.getMyOrder(orderId));
      this.order.set(order);
    } catch {
      this.toast.show("Unable to load that order.", "error");
    } finally {
      this.loading.set(false);
    }
  }
}
