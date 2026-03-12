import { CommonModule, DatePipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type {
  InventoryTransaction,
  InventoryTransactionType,
  ProductCard,
} from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-inventory-page",
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Inventory Journal</p>
            <h2>Create manual stock movement</h2>
          </div>
        </header>

        <form class="form-grid" (ngSubmit)="createTransaction()">
          <label class="field field-full">
            <span>Product</span>
            <select class="input" name="productId" [(ngModel)]="model.productId" required>
              <option value="">Select product</option>
              @for (product of products(); track product.id) {
                <option [value]="product.id">{{ product.name }} ({{ product.sku }})</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Type</span>
            <select class="input" name="type" [(ngModel)]="model.type">
              @for (type of movementTypes; track type) {
                <option [value]="type">{{ type }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span>Quantity</span>
            <input class="input" type="number" name="quantity" [(ngModel)]="model.quantity" min="1" required />
          </label>

          <label class="field field-full">
            <span>Note</span>
            <textarea class="input" rows="4" name="note" [(ngModel)]="model.note"></textarea>
          </label>

          <button type="submit" class="primary-button field-full">Create transaction</button>
        </form>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Low stock</p>
            <h2>{{ lowStock().length }} products under threshold</h2>
          </div>
        </header>

        <div class="stack-list">
          @for (product of lowStock(); track product.id) {
            <article class="list-card">
              <div class="summary-row">
                <span>{{ product.name }} ({{ product.sku }})</span>
                <strong>{{ product.stockQty }}</strong>
              </div>
            </article>
          }
        </div>
      </article>
    </section>

    <section class="panel">
      <header class="section-heading">
        <div>
          <p class="eyebrow">Transactions</p>
          <h2>{{ transactions().length }} recent movements</h2>
        </div>
      </header>

      <div class="stack-list">
        @for (transaction of transactions(); track transaction.id) {
          <article class="list-card">
            <div class="list-card__header">
              <div>
                <h3>{{ transaction.product.name }}</h3>
                <p>{{ transaction.type }} · {{ transaction.createdAt | date: "medium" }}</p>
              </div>
              <span class="badge neutral">{{ transaction.quantity }}</span>
            </div>
            <p>{{ transaction.note || "No note" }}</p>
          </article>
        }
      </div>
    </section>
  `,
})
export class InventoryPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly products = signal<ProductCard[]>([]);
  protected readonly lowStock = signal<Array<Pick<ProductCard, "id" | "sku" | "name" | "stockQty">>>([]);
  protected readonly transactions = signal<InventoryTransaction[]>([]);
  protected readonly movementTypes: Exclude<InventoryTransactionType, "SALE">[] = [
    "RESTOCK",
    "ADJUSTMENT_IN",
    "ADJUSTMENT_OUT",
    "RETURN_IN",
    "RETURN_OUT",
  ];
  protected readonly model: {
    productId: string;
    type: Exclude<InventoryTransactionType, "SALE">;
    quantity: number;
    note: string;
  } = {
    productId: "",
    type: "RESTOCK",
    quantity: 1,
    note: "",
  };

  constructor() {
    void this.loadInventoryData();
  }

  protected async createTransaction(): Promise<void> {
    try {
      await firstValueFrom(
        this.adminService.createInventoryTransaction({
          productId: this.model.productId,
          type: this.model.type,
          quantity: this.model.quantity,
          note: this.model.note || undefined,
        }),
      );
      this.toast.show("Inventory transaction created", "success");
      this.model.productId = "";
      this.model.type = "RESTOCK";
      this.model.quantity = 1;
      this.model.note = "";
      await this.loadInventoryData();
    } catch {
      this.toast.show("Unable to create inventory transaction.", "error");
    }
  }

  private async loadInventoryData(): Promise<void> {
    try {
      const [products, transactions, lowStock] = await Promise.all([
        firstValueFrom(
          this.adminService.getProducts({
            limit: 100,
            sortBy: "name",
            sortOrder: "asc",
          }),
        ),
        firstValueFrom(this.adminService.getInventory({ limit: 30 })),
        firstValueFrom(this.adminService.getLowStock(10)),
      ]);

      this.products.set(products.items);
      this.transactions.set(transactions.items);
      this.lowStock.set(lowStock);
    } catch {
      this.toast.show("Unable to load inventory data.", "error");
    }
  }
}
