import { CommonModule, CurrencyPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type {
  Brand,
  Category,
  ProductAttribute,
  ProductCard,
  ProductDetail,
} from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";

interface ProductFormModel {
  sku: string;
  name: string;
  description: string;
  price: number;
  stockQty: number;
  isActive: boolean;
  categoryId: string;
  brandId: string;
  attributesText: string;
}

function emptyProductForm(): ProductFormModel {
  return {
    sku: "",
    name: "",
    description: "",
    price: 0,
    stockQty: 0,
    isActive: true,
    categoryId: "",
    brandId: "",
    attributesText: "",
  };
}

@Component({
  selector: "app-products-page",
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Product Desk</p>
            <h2>{{ editingProductId() ? "Edit product" : "Create product" }}</h2>
          </div>
        </header>

        <form class="form-grid" (ngSubmit)="saveProduct()">
          <label class="field">
            <span>SKU</span>
            <input class="input" name="sku" [(ngModel)]="model.sku" [disabled]="!!editingProductId()" required />
          </label>

          <label class="field">
            <span>Name</span>
            <input class="input" name="name" [(ngModel)]="model.name" required />
          </label>

          <label class="field field-full">
            <span>Description</span>
            <textarea class="input" rows="4" name="description" [(ngModel)]="model.description"></textarea>
          </label>

          <label class="field">
            <span>Price</span>
            <input class="input" type="number" name="price" [(ngModel)]="model.price" min="0" required />
          </label>

          <label class="field">
            <span>Stock</span>
            <input class="input" type="number" name="stockQty" [(ngModel)]="model.stockQty" min="0" required />
          </label>

          <label class="field">
            <span>Category</span>
            <select class="input" name="categoryId" [(ngModel)]="model.categoryId" required>
              <option value="">Select category</option>
              @for (category of categories(); track category.id) {
                <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Brand</span>
            <select class="input" name="brandId" [(ngModel)]="model.brandId" required>
              <option value="">Select brand</option>
              @for (brand of brands(); track brand.id) {
                <option [value]="brand.id">{{ brand.name }}</option>
              }
            </select>
          </label>

          <label class="toggle-field field-full">
            <input type="checkbox" name="isActive" [(ngModel)]="model.isActive" />
            <span>Visible in storefront</span>
          </label>

          <label class="field field-full">
            <span>Attributes (one per line as <code>name:value</code>)</span>
            <textarea class="input" rows="6" name="attributesText" [(ngModel)]="model.attributesText"></textarea>
          </label>

          <label class="field field-full">
            <span>Upload image</span>
            <input type="file" accept="image/*" (change)="selectFile(filePicker.files)" #filePicker />
          </label>

          <label class="toggle-field field-full">
            <input type="checkbox" name="imageIsPrimary" [(ngModel)]="imageIsPrimary" />
            <span>Mark uploaded image as primary</span>
          </label>

          <div class="toolbar-actions field-full">
            <button type="submit" class="primary-button">
              {{ editingProductId() ? "Update product" : "Create product" }}
            </button>
            @if (editingProductId()) {
              <button type="button" class="ghost-button" (click)="resetForm()">Cancel</button>
            }
          </div>
        </form>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Catalog inventory</p>
            <h2>{{ products().length }} products loaded</h2>
          </div>
        </header>

        <div class="stack-list">
          @for (product of products(); track product.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <h3>{{ product.name }}</h3>
                  <p>{{ product.category.name }} / {{ product.brand.name }} / {{ product.sku }}</p>
                </div>
                <span class="badge" [class]="product.isActive ? 'success' : 'danger'">
                  {{ product.isActive ? "Active" : "Hidden" }}
                </span>
              </div>

              <div class="metrics-row">
                <span>Stock {{ product.stockQty }}</span>
                <strong>{{ priceOf(product.price) | currency: "THB" : "symbol-narrow" }}</strong>
              </div>

              <div class="toolbar-actions">
                <button type="button" class="ghost-button" (click)="editProduct(product.id)">Edit</button>
                <button type="button" class="ghost-button danger-text" (click)="deleteProduct(product.id)">Delete</button>
              </div>
            </article>
          }
        </div>
      </article>
    </section>
  `,
})
export class ProductsPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<ProductCard[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly brands = signal<Brand[]>([]);
  protected readonly editingProductId = signal<string | null>(null);
  protected model = emptyProductForm();
  protected imageFile: File | null = null;
  protected imageIsPrimary = true;

  constructor() {
    void this.loadMeta();
    void this.loadProducts();
  }

  protected selectFile(files: FileList | null): void {
    this.imageFile = files?.item(0) ?? null;
  }

  protected async editProduct(productId: string): Promise<void> {
    try {
      const product = await firstValueFrom(this.adminService.getProduct(productId));
      this.fillForm(product);
      this.editingProductId.set(productId);
    } catch {
      this.toast.show("Unable to load product detail.", "error");
    }
  }

  protected resetForm(): void {
    this.editingProductId.set(null);
    this.model = emptyProductForm();
    this.imageFile = null;
    this.imageIsPrimary = true;
  }

  protected async saveProduct(): Promise<void> {
    try {
      const attributes = this.parseAttributes(this.model.attributesText);
      const editingProductId = this.editingProductId();

      let product: ProductDetail;
      if (editingProductId) {
        product = await firstValueFrom(
          this.adminService.updateProduct(editingProductId, {
            name: this.model.name,
            description: this.model.description || undefined,
            price: this.model.price,
            stockQty: this.model.stockQty,
            isActive: this.model.isActive,
            categoryId: this.model.categoryId,
            brandId: this.model.brandId,
          }),
        );
        await firstValueFrom(
          this.adminService.updateProductAttributes(editingProductId, attributes),
        );
        this.toast.show("Product updated", "success");
      } else {
        product = await firstValueFrom(
          this.adminService.createProduct({
            sku: this.model.sku,
            name: this.model.name,
            description: this.model.description || undefined,
            price: this.model.price,
            stockQty: this.model.stockQty,
            isActive: this.model.isActive,
            categoryId: this.model.categoryId,
            brandId: this.model.brandId,
            attributes,
          }),
        );
        this.toast.show("Product created", "success");
      }

      if (this.imageFile) {
        await firstValueFrom(
          this.adminService.uploadProductImage(
            product.id,
            this.imageFile,
            this.imageIsPrimary,
          ),
        );
      }

      this.resetForm();
      await this.loadProducts();
    } catch {
      this.toast.show("Unable to save product.", "error");
    }
  }

  protected async deleteProduct(productId: string): Promise<void> {
    if (!window.confirm("Delete this product?")) {
      return;
    }

    try {
      await firstValueFrom(this.adminService.deleteProduct(productId));
      this.toast.show("Product deleted", "success");
      await this.loadProducts();
    } catch {
      this.toast.show("Unable to delete product.", "error");
    }
  }

  protected priceOf(value: number | string): number {
    return Number(value);
  }

  private parseAttributes(rawText: string): ProductAttribute[] {
    const attributes: ProductAttribute[] = [];
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const delimiterIndex = line.indexOf(":");
      if (delimiterIndex < 1) {
        continue;
      }

      const name = line.slice(0, delimiterIndex).trim();
      const value = line.slice(delimiterIndex + 1).trim();
      if (name && value) {
        attributes.push({ name, value });
      }
    }

    return attributes;
  }

  private fillForm(product: ProductDetail): void {
    this.model = {
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      price: Number(product.price),
      stockQty: product.stockQty,
      isActive: product.isActive,
      categoryId: product.category.id,
      brandId: product.brand.id,
      attributesText: product.attributes
        .map((attribute) => `${attribute.name}:${attribute.value}`)
        .join("\n"),
    };
  }

  private async loadMeta(): Promise<void> {
    try {
      const [categories, brands] = await Promise.all([
        firstValueFrom(this.adminService.getCategories()),
        firstValueFrom(this.adminService.getBrands()),
      ]);
      this.categories.set(categories);
      this.brands.set(brands);
    } catch {
      this.toast.show("Unable to load category or brand data.", "error");
    }
  }

  private async loadProducts(): Promise<void> {
    try {
      const result = await firstValueFrom(
        this.adminService.getProducts({
          limit: 50,
          sortBy: "createdAt",
          sortOrder: "desc",
        }),
      );
      this.products.set(result.items);
    } catch {
      this.toast.show("Unable to load products.", "error");
    }
  }
}
