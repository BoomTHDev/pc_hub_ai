import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { Address, Cart, PaymentMethod } from "../../core/models/domain.models";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="checkout-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Checkout</p>
            <h1>Confirm shipping and payment</h1>
          </div>
        </header>

        @if (loading()) {
          <div class="empty-panel">Loading checkout data...</div>
        } @else if (!hasCartItems()) {
          <div class="empty-panel">
            <p>Your cart is empty.</p>
            <a routerLink="/" class="primary-button">Return to catalog</a>
          </div>
        } @else if (!addresses().length) {
          <div class="empty-panel">
            <p>You need at least one address before checking out.</p>
            <a routerLink="/account" class="primary-button">Manage addresses</a>
          </div>
        } @else {
          <form class="form-stack" (ngSubmit)="submitOrder()">
            <label class="field">
              <span>Shipping address</span>
              <select class="input" name="addressId" [(ngModel)]="model.addressId" required>
                <option value="">Select address</option>
                @for (address of addresses(); track address.id) {
                  <option [value]="address.id">
                    {{ address.recipientName }} | {{ address.line1 }} | {{ address.province }}
                  </option>
                }
              </select>
            </label>

            <label class="field">
              <span>Payment method</span>
              <select class="input" name="paymentMethod" [(ngModel)]="model.paymentMethod">
                <option value="PROMPTPAY_QR">PromptPay QR</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </label>

            <label class="field">
              <span>Order note</span>
              <textarea class="input" rows="4" name="note" [(ngModel)]="model.note"></textarea>
            </label>

            <button type="submit" class="primary-button" [disabled]="submitting()">
              {{ submitting() ? "Creating order..." : "Place order" }}
            </button>
          </form>
        }
      </article>

      <aside class="summary-card">
        <p class="eyebrow">Order summary</p>
        @if (hasCartItems()) {
          @for (item of cart()!.items; track item.productId) {
            <div class="summary-row">
              <span>{{ item.product.name }} x {{ item.quantity }}</span>
              <strong>{{ priceOf(item.unitPrice) * item.quantity | currency: "THB" : "symbol-narrow" }}</strong>
            </div>
          }
        }
        <div class="summary-row total">
          <span>Grand total</span>
          <strong>{{ cart()?.subTotal ?? 0 | currency: "THB" : "symbol-narrow" }}</strong>
        </div>
      </aside>
    </section>
  `,
})
export class CheckoutPageComponent {
  private readonly customerService = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly submitting = signal(false);
  protected readonly cart = signal<Cart | null>(null);
  protected readonly addresses = signal<Address[]>([]);
  protected readonly model: {
    addressId: string;
    paymentMethod: PaymentMethod;
    note: string;
  } = {
    addressId: "",
    paymentMethod: "PROMPTPAY_QR",
    note: "",
  };

  constructor() {
    void this.loadCheckoutData();
  }

  protected async submitOrder(): Promise<void> {
    if (!this.model.addressId) {
      this.toast.show("Select a shipping address first.", "error");
      return;
    }

    this.submitting.set(true);
    try {
      const order = await firstValueFrom(
        this.customerService.checkout({
          addressId: this.model.addressId,
          paymentMethod: this.model.paymentMethod,
          note: this.model.note || undefined,
        }),
      );
      this.toast.show(`Order ${order.orderNumber} created`, "success");
      await this.router.navigate(["/orders", order.id]);
    } catch {
      this.toast.show("Unable to create the order.", "error");
    } finally {
      this.submitting.set(false);
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  protected hasCartItems(): boolean {
    return (this.cart()?.items.length ?? 0) > 0;
  }

  private async loadCheckoutData(): Promise<void> {
    this.loading.set(true);
    try {
      const [cart, addresses] = await Promise.all([
        firstValueFrom(this.customerService.getCart()),
        firstValueFrom(this.customerService.getAddresses()),
      ]);
      this.cart.set(cart);
      this.addresses.set(addresses);
      this.model.addressId =
        addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? "";
    } catch {
      this.toast.show("Unable to load checkout information.", "error");
    } finally {
      this.loading.set(false);
    }
  }
}

