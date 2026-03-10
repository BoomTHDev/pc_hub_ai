import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type {
  PaymentDetail,
  PaymentMethod,
  PaymentStatus,
} from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";
import {
  paymentMethodLabel,
  paymentStatusLabel,
  paymentStatusTone,
} from "../../core/utils/status";

@Component({
  selector: "app-payments-page",
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Payments</p>
            <h2>Review payment operations</h2>
          </div>
        </header>

        <form class="toolbar-grid compact" (ngSubmit)="loadPayments()">
          <label class="field">
            <span>Status</span>
            <select class="input" name="status" [(ngModel)]="statusFilter">
              <option value="">All statuses</option>
              @for (status of statuses; track status) {
                <option [value]="status">{{ paymentStatusLabel(status) }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Method</span>
            <select class="input" name="method" [(ngModel)]="methodFilter">
              <option value="">All methods</option>
              <option value="PROMPTPAY_QR">PromptPay QR</option>
              <option value="COD">Cash on Delivery</option>
            </select>
          </label>

          <div class="toolbar-actions">
            <button type="submit" class="primary-button">Apply</button>
          </div>
        </form>

        <div class="stack-list">
          @for (payment of payments(); track payment.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <p class="eyebrow">{{ payment.order.orderNumber }}</p>
                  <h3>{{ payment.order.user?.email }}</h3>
                </div>
                <span class="badge" [class]="paymentStatusTone(payment.status)">
                  {{ paymentStatusLabel(payment.status) }}
                </span>
              </div>
              <div class="metrics-row">
                <span>{{ paymentMethodLabel(payment.method) }}</span>
                <strong>{{ priceOf(payment.amount) | currency: "THB" : "symbol-narrow" }}</strong>
              </div>
              <button type="button" class="ghost-button" (click)="selectPayment(payment.id)">
                Inspect payment
              </button>
            </article>
          }
        </div>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Review</p>
            <h2>{{ selectedPaymentTitle() }}</h2>
          </div>
        </header>

        @if (!selectedPayment()) {
          <div class="empty-panel">Choose a payment record to approve, reject, or mark COD as paid.</div>
        } @else {
          <div class="stack-list">
            <article class="list-card">
              <div class="summary-row">
                <span>Customer</span>
                <strong>{{ selectedPayment()!.order.user?.email }}</strong>
              </div>
              <div class="summary-row">
                <span>Method</span>
                <strong>{{ paymentMethodLabel(selectedPayment()!.method) }}</strong>
              </div>
            </article>

            @if (selectedPayment()!.slips.length) {
              <img class="receipt-image" [src]="selectedPayment()!.slips[0].imageUrl" alt="Payment slip" />
            }

            <label class="field">
              <span>Review note</span>
              <textarea class="input" rows="4" name="reviewNote" [(ngModel)]="reviewNote"></textarea>
            </label>

            <div class="toolbar-actions">
              @if (selectedPayment()!.status === "WAITING_REVIEW") {
                <button type="button" class="primary-button" (click)="reviewPayment('APPROVE')">Approve</button>
                <button type="button" class="ghost-button danger-text" (click)="reviewPayment('REJECT')">Reject</button>
              }

              @if (selectedPayment()!.status === "COD_PENDING") {
                <button type="button" class="primary-button" (click)="markCodPaid()">Mark COD paid</button>
              }
            </div>
          </div>
        }
      </article>
    </section>
  `,
})
export class PaymentsPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly payments = signal<PaymentDetail[]>([]);
  protected readonly selectedPayment = signal<PaymentDetail | null>(null);
  protected readonly statuses: PaymentStatus[] = [
    "AWAITING_SLIP",
    "WAITING_REVIEW",
    "APPROVED",
    "REJECTED",
    "COD_PENDING",
    "COD_PAID",
    "CANCELLED",
  ];
  protected statusFilter: PaymentStatus | "" = "";
  protected methodFilter: PaymentMethod | "" = "";
  protected reviewNote = "";
  protected readonly paymentMethodLabel = paymentMethodLabel;
  protected readonly paymentStatusLabel = paymentStatusLabel;
  protected readonly paymentStatusTone = paymentStatusTone;

  constructor() {
    void this.loadPayments();
  }

  protected async selectPayment(paymentId: string): Promise<void> {
    try {
      const payment = await firstValueFrom(this.adminService.getPayment(paymentId));
      this.selectedPayment.set(payment);
      this.reviewNote = payment.reviewNote ?? "";
    } catch {
      this.toast.show("Unable to load payment detail.", "error");
    }
  }

  protected async reviewPayment(action: "APPROVE" | "REJECT"): Promise<void> {
    const payment = this.selectedPayment();
    if (!payment) {
      return;
    }

    try {
      const updated = await firstValueFrom(
        this.adminService.reviewPayment(payment.id, action, this.reviewNote || undefined),
      );
      this.selectedPayment.set(updated);
      this.toast.show(`Payment ${action.toLowerCase()}d`, "success");
      await this.loadPayments();
    } catch {
      this.toast.show("Unable to review payment.", "error");
    }
  }

  protected async markCodPaid(): Promise<void> {
    const payment = this.selectedPayment();
    if (!payment) {
      return;
    }

    try {
      const updated = await firstValueFrom(
        this.adminService.markCodPaid(payment.id, this.reviewNote || undefined),
      );
      this.selectedPayment.set(updated);
      this.toast.show("COD marked as paid", "success");
      await this.loadPayments();
    } catch {
      this.toast.show("Unable to mark COD as paid.", "error");
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  protected selectedPaymentTitle(): string {
    const payment = this.selectedPayment();
    return payment ? payment.order.orderNumber : "Choose a payment";
  }

  protected async loadPayments(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.adminService.getPayments({
          limit: 30,
          status: this.statusFilter || undefined,
          method: this.methodFilter || undefined,
        }),
      );
      this.payments.set(result.items);
    } catch {
      this.toast.show("Unable to load payments.", "error");
    }
  }
}
