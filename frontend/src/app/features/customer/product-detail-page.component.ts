import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { ProductDetail } from "../../core/models/domain.models";
import { AuthService } from "../../core/services/auth.service";
import { CatalogService } from "../../core/services/catalog.service";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-product-detail-page",
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    @if (loading()) {
      <div class="empty-panel">Loading product...</div>
    } @else if (!product()) {
      <div class="empty-panel">The requested product could not be loaded.</div>
    } @else {
      <section class="product-detail">
        <article class="product-gallery">
          @if (product()!.images.length) {
            <img [src]="selectedImage()" [alt]="product()!.name" class="product-gallery__hero" />
            <div class="product-gallery__thumbs">
              @for (image of product()!.images; track image.id) {
                <button type="button" class="thumb-button" (click)="selectedImage.set(image.imageUrl)">
                  <img [src]="image.imageUrl" [alt]="product()!.name" />
                </button>
              }
            </div>
          } @else {
            <div class="empty-panel">No product images uploaded.</div>
          }
        </article>

        <article class="product-summary">
          <p class="eyebrow">{{ product()!.category.name }} / {{ product()!.brand.name }}</p>
          <h1>{{ product()!.name }}</h1>
          <p class="hero-copy">{{ product()!.description || "No description provided." }}</p>

          <div class="price-block">
            <strong>{{ priceOf(product()!.price) | currency: "THB" : "symbol-narrow" }}</strong>
            <span class="subtle-label">SKU {{ product()!.sku }} | Stock {{ product()!.stockQty }}</span>
          </div>

          <div class="toolbar-grid compact">
            <label class="field">
              <span>Quantity</span>
              <input class="input" type="number" min="1" [max]="product()!.stockQty" [(ngModel)]="quantity" />
            </label>
            <button
              type="button"
              class="primary-button"
              [disabled]="!product()!.isActive || product()!.stockQty < 1"
              (click)="addToCart()"
            >
              Add to cart
            </button>
          </div>

          <section class="panel">
            <header class="section-heading">
              <div>
                <p class="eyebrow">Attributes</p>
                <h2>Build notes</h2>
              </div>
            </header>
            @if (product()!.attributes.length) {
              <dl class="spec-list">
                @for (attribute of product()!.attributes; track attribute.name) {
                  <div class="spec-list__row">
                    <dt>{{ attribute.name }}</dt>
                    <dd>{{ attribute.value }}</dd>
                  </div>
                }
              </dl>
            } @else {
              <p class="support-copy">No product attributes have been entered yet.</p>
            }
          </section>
        </article>
      </section>
    }
  `,
})
export class ProductDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogService = inject(CatalogService);
  private readonly customerService = inject(CustomerService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly product = signal<ProductDetail | null>(null);
  protected readonly selectedImage = signal("");
  protected quantity = 1;

  constructor() {
    void this.loadProduct();
  }

  protected async addToCart(): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }

    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(["/login"], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    try {
      await firstValueFrom(this.customerService.addToCart(product.id, this.quantity));
      this.toast.show(`${product.name} added to cart`, "success");
    } catch {
      this.toast.show("Unable to add this product to the cart.", "error");
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  private async loadProduct(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get("slug");
    if (!slug) {
      return;
    }

    this.loading.set(true);

    try {
      const product = await firstValueFrom(this.catalogService.getProductBySlug(slug));
      this.product.set(product);
      this.selectedImage.set(product.images[0]?.imageUrl ?? "");
    } catch {
      this.toast.show("Unable to load that product.", "error");
    } finally {
      this.loading.set(false);
    }
  }
}

