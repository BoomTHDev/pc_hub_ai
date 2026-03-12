import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { Cart } from "../../core/models/domain.models";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-cart-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="panel">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Cart</p>
          <h1>Your active build queue</h1>
        </div>
        @if (hasItems()) {
          <button type="button" class="ghost-button" (click)="clearCart()">Clear cart</button>
        }
      </header>

      @if (loading()) {
        <div class="empty-panel">Loading cart...</div>
      } @else if (!hasItems()) {
        <div class="empty-panel">
          <p>Your cart is empty.</p>
          <a routerLink="/" class="primary-button">Browse catalog</a>
        </div>
      } @else {
        <div class="cart-layout">
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of cart()!.items; track item.productId) {
                  <tr>
                    <td>
                      <div class="table-media">
                        @if (item.product.images[0]?.imageUrl) {
                          <img [src]="item.product.images[0]?.imageUrl" [alt]="item.product.name" />
                        }
                        <div>
                          <strong>{{ item.product.name }}</strong>
                          <p>{{ item.product.brand.name }}</p>
                        </div>
                      </div>
                    </td>
                    <td>{{ priceOf(item.unitPrice) | currency: "THB" : "symbol-narrow" }}</td>
                    <td>
                      <div class="inline-controls">
                        <input
                          class="input quantity-input"
                          type="number"
                          min="1"
                          [max]="item.product.stockQty"
                          [ngModel]="draftQuantity(item.productId, item.quantity)"
                          (ngModelChange)="setDraft(item.productId, $event)"
                        />
                        <button type="button" class="ghost-button" (click)="updateItem(item.productId)">
                          Update
                        </button>
                      </div>
                    </td>
                    <td>{{ priceOf(item.unitPrice) * item.quantity | currency: "THB" : "symbol-narrow" }}</td>
                    <td>
                      <button type="button" class="ghost-button danger-text" (click)="removeItem(item.productId)">
                        Remove
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <aside class="summary-card">
            <p class="eyebrow">Summary</p>
            <h2>{{ cart()!.itemCount }} items</h2>
            <div class="summary-row">
              <span>Subtotal</span>
              <strong>{{ cart()!.subTotal | currency: "THB" : "symbol-narrow" }}</strong>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <strong>Free</strong>
            </div>
            <div class="summary-row total">
              <span>Grand total</span>
              <strong>{{ cart()!.subTotal | currency: "THB" : "symbol-narrow" }}</strong>
            </div>

            <button type="button" class="primary-button" (click)="goCheckout()">
              Proceed to checkout
            </button>
          </aside>
        </div>
      }
    </section>
  `,
})
export class CartPageComponent {
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly cart = signal<Cart | null>(null);
  protected readonly quantityDrafts = signal<Record<string, number>>({});

  constructor() {
    void this.loadCart();
  }

  protected setDraft(productId: string, quantity: number): void {
    this.quantityDrafts.update((drafts) => ({
      ...drafts,
      [productId]: quantity,
    }));
  }

  protected async updateItem(productId: string): Promise<void> {
    const quantity = this.quantityDrafts()[productId];
    if (!quantity || quantity < 1) {
      this.toast.show("Quantity must be at least 1.", "error");
      return;
    }

    try {
      const cart = await firstValueFrom(
        this.customerService.updateCartItem(productId, quantity),
      );
      this.syncCart(cart);
      this.toast.show("Cart updated", "success");
    } catch {
      this.toast.show("Unable to update that cart item.", "error");
    }
  }

  protected async removeItem(productId: string): Promise<void> {
    try {
      const cart = await firstValueFrom(this.customerService.removeCartItem(productId));
      this.syncCart(cart);
      this.toast.show("Item removed", "success");
    } catch {
      this.toast.show("Unable to remove that cart item.", "error");
    }
  }

  protected async clearCart(): Promise<void> {
    try {
      await firstValueFrom(this.customerService.clearCart());
      this.syncCart({
        id: "",
        userId: "",
        status: "ACTIVE",
        createdAt: "",
        updatedAt: "",
        items: [],
        itemCount: 0,
        subTotal: 0,
      });
      this.toast.show("Cart cleared", "success");
    } catch {
      this.toast.show("Unable to clear the cart.", "error");
    }
  }

  protected async goCheckout(): Promise<void> {
    await this.router.navigateByUrl("/checkout");
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  protected hasItems(): boolean {
    return (this.cart()?.items.length ?? 0) > 0;
  }

  protected draftQuantity(productId: string, fallback: number): number {
    const quantity = this.quantityDrafts()[productId];
    return quantity === undefined ? fallback : quantity;
  }

  private async loadCart(): Promise<void> {
    this.loading.set(true);
    try {
      const cart = await firstValueFrom(this.customerService.getCart());
      this.syncCart(cart);
    } catch {
      this.toast.show("Unable to load cart data.", "error");
    } finally {
      this.loading.set(false);
    }
  }

  private syncCart(cart: Cart): void {
    this.cart.set(cart);
    const drafts: Record<string, number> = {};
    for (const item of cart.items) {
      drafts[item.productId] = item.quantity;
    }
    this.quantityDrafts.set(drafts);
  }
}
