import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { Pagination } from "../../core/models/api.models";
import type { Brand, Category, ProductCard } from "../../core/models/domain.models";
import { AuthService } from "../../core/services/auth.service";
import { CatalogService } from "../../core/services/catalog.service";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-catalog-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CurrencyPipe],
  template: `
    <section class="hero-banner">
      <div class="hero-banner__content">
        <p class="eyebrow">Storefront</p>
        <h1>Build-ready parts, clean inventory visibility, and checkout in one flow.</h1>
        <p class="hero-copy">
          Search by category, narrow by brand, and move straight from product discovery to order creation.
        </p>
      </div>
      <div class="hero-banner__stats">
        <article class="stat-card">
          <strong>{{ products().length }}</strong>
          <span>Visible products</span>
        </article>
        <article class="stat-card">
          <strong>{{ categories().length }}</strong>
          <span>Categories</span>
        </article>
        <article class="stat-card">
          <strong>{{ brands().length }}</strong>
          <span>Brands</span>
        </article>
      </div>
    </section>

    <section class="panel">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Filters</p>
          <h2>Refine the catalog</h2>
        </div>
      </header>

      <form class="toolbar-grid" (ngSubmit)="applyFilters()">
        <label class="field">
          <span>Search</span>
          <input class="input" name="search" [(ngModel)]="filters.search" placeholder="GPU, motherboard, RTX..." />
        </label>

        <label class="field">
          <span>Category</span>
          <select class="input" name="categoryId" [(ngModel)]="filters.categoryId">
            <option value="">All categories</option>
            @for (category of categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
            }
          </select>
        </label>

        <label class="field">
          <span>Brand</span>
          <select class="input" name="brandId" [(ngModel)]="filters.brandId">
            <option value="">All brands</option>
            @for (brand of brands(); track brand.id) {
              <option [value]="brand.id">{{ brand.name }}</option>
            }
          </select>
        </label>

        <label class="field">
          <span>Sort by</span>
          <select class="input" name="sortBy" [(ngModel)]="filters.sortBy">
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </label>

        <div class="toolbar-actions">
          <button type="submit" class="primary-button">Apply</button>
          <button type="button" class="ghost-button" (click)="resetFilters()">Reset</button>
        </div>
      </form>
    </section>

    <section class="product-grid-section">
      @if (loading()) {
        <div class="empty-panel">Loading products...</div>
      } @else if (!products().length) {
        <div class="empty-panel">No products match the current filters.</div>
      } @else {
        <div class="product-grid">
          @for (product of products(); track product.id) {
            <article class="product-card">
              <a [routerLink]="['/products', product.slug]" class="product-card__media">
                @if (product.images[0]?.imageUrl) {
                  <img [src]="product.images[0]?.imageUrl" [alt]="product.name" />
                } @else {
                  <div class="product-card__placeholder">No image</div>
                }
              </a>

              <div class="product-card__body">
                <div class="product-card__meta">
                  <span class="badge neutral">{{ product.category.name }}</span>
                  <span class="subtle-label">{{ product.brand.name }}</span>
                </div>

                <a [routerLink]="['/products', product.slug]" class="product-card__title">
                  {{ product.name }}
                </a>
                <p class="support-copy">{{ product.description || "No description provided." }}</p>

                <div class="product-card__footer">
                  <div>
                    <strong>{{ priceOf(product.price) | currency: "THB" : "symbol-narrow" }}</strong>
                    <span class="subtle-label">Stock {{ product.stockQty }}</span>
                  </div>
                  <button
                    type="button"
                    class="primary-button"
                    [disabled]="!product.isActive || product.stockQty < 1"
                    (click)="addToCart(product)"
                  >
                    Add to cart
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </section>

    <section class="panel pagination-bar">
      <div>
        <strong>Page {{ pagination().page }}</strong>
        <span class="subtle-label">of {{ pagination().totalPages }}</span>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="ghost-button" [disabled]="pagination().page <= 1" (click)="changePage(-1)">
          Previous
        </button>
        <button
          type="button"
          class="ghost-button"
          [disabled]="pagination().page >= pagination().totalPages"
          (click)="changePage(1)"
        >
          Next
        </button>
      </div>
    </section>
  `,
})
export class CatalogPageComponent {
  private readonly catalogService = inject(CatalogService);
  private readonly customerService = inject(CustomerService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly products = signal<ProductCard[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly brands = signal<Brand[]>([]);
  protected readonly pagination = signal<Pagination>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 1,
  });

  protected readonly filters: {
    search: string;
    categoryId: string;
    brandId: string;
    sortBy: "name" | "price" | "createdAt";
    sortOrder: "asc" | "desc";
  } = {
    search: "",
    categoryId: "",
    brandId: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  };

  constructor() {
    void this.loadMeta();
    void this.loadProducts();
  }

  protected async applyFilters(): Promise<void> {
    this.pagination.update((value) => ({ ...value, page: 1 }));
    await this.loadProducts();
  }

  protected async resetFilters(): Promise<void> {
    this.filters.search = "";
    this.filters.categoryId = "";
    this.filters.brandId = "";
    this.filters.sortBy = "createdAt";
    this.filters.sortOrder = "desc";
    this.pagination.update((value) => ({ ...value, page: 1 }));
    await this.loadProducts();
  }

  protected async changePage(direction: number): Promise<void> {
    const nextPage = this.pagination().page + direction;
    if (nextPage < 1 || nextPage > this.pagination().totalPages) {
      return;
    }

    this.pagination.update((value) => ({ ...value, page: nextPage }));
    await this.loadProducts();
  }

  protected async addToCart(product: ProductCard): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      await this.router.navigate(["/login"], {
        queryParams: { redirect: this.router.url },
      });
      return;
    }

    try {
      await firstValueFrom(this.customerService.addToCart(product.id, 1));
      this.toast.show(`${product.name} added to cart`, "success");
    } catch {
      this.toast.show("Unable to add that product to the cart.", "error");
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  private async loadMeta(): Promise<void> {
    const [categories, brands] = await Promise.all([
      firstValueFrom(this.catalogService.getCategories()),
      firstValueFrom(this.catalogService.getBrands()),
    ]);

    this.categories.set(categories);
    this.brands.set(brands);
  }

  private async loadProducts(): Promise<void> {
    this.loading.set(true);

    try {
      const result = await firstValueFrom(
        this.catalogService.getProducts({
          page: this.pagination().page,
          limit: this.pagination().limit,
          search: this.filters.search || undefined,
          categoryId: this.filters.categoryId || undefined,
          brandId: this.filters.brandId || undefined,
          sortBy: this.filters.sortBy,
          sortOrder: this.filters.sortOrder,
          isActive: true,
        }),
      );

      this.products.set(result.items);
      this.pagination.set(result.pagination);
    } catch {
      this.toast.show("Unable to load catalog data.", "error");
    } finally {
      this.loading.set(false);
    }
  }
}
