import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";

interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
}

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="metrics-grid">
      @for (metric of metrics(); track metric.label) {
        <article class="metric-card">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <small>{{ metric.detail }}</small>
        </article>
      }
    </section>

    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Low stock radar</p>
            <h2>Products needing attention</h2>
          </div>
        </header>

        @if (loading()) {
          <div class="empty-panel">Loading dashboard...</div>
        } @else if (!lowStock().length) {
          <div class="empty-panel">No low stock items under the current threshold.</div>
        } @else {
          <div class="stack-list">
            @for (item of lowStock(); track item.id) {
              <article class="list-card">
                <div class="summary-row">
                  <span>{{ item.name }} ({{ item.sku }})</span>
                  <strong>{{ item.stockQty }} units</strong>
                </div>
              </article>
            }
          </div>
        }
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Coverage</p>
            <h2>Operational notes</h2>
          </div>
        </header>
        <ul class="bullet-list">
          <li>Catalog CRUD and attribute/image management are available in the product desk.</li>
          <li>Payment review supports PromptPay approval and COD paid marking.</li>
          <li>User activation and staff creation remain restricted to admins.</li>
        </ul>
      </article>
    </section>
  `,
})
export class DashboardPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly metrics = signal<DashboardMetric[]>([]);
  protected readonly lowStock = signal<
    Array<Pick<{ id: string; sku: string; name: string; stockQty: number }, "id" | "sku" | "name" | "stockQty">>
  >([]);

  constructor() {
    void this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);

    try {
      const results = await Promise.allSettled([
        firstValueFrom(this.adminService.getProducts({ limit: 1 })),
        firstValueFrom(this.adminService.getOrders({ limit: 1 })),
        firstValueFrom(this.adminService.getPayments({ limit: 1 })),
        firstValueFrom(this.adminService.getUsers({ limit: 1 })),
        firstValueFrom(this.adminService.getLowStock(10)),
      ]);

      const nextMetrics: DashboardMetric[] = [
        {
          label: "Products",
          value:
            results[0].status === "fulfilled"
              ? String(results[0].value.pagination.total)
              : "N/A",
          detail: "Tracked SKUs",
        },
        {
          label: "Orders",
          value:
            results[1].status === "fulfilled"
              ? String(results[1].value.pagination.total)
              : "N/A",
          detail: "Across all statuses",
        },
        {
          label: "Payments",
          value:
            results[2].status === "fulfilled"
              ? String(results[2].value.pagination.total)
              : "N/A",
          detail: "Review queue included",
        },
      ];

      if (results[3].status === "fulfilled") {
        nextMetrics.push({
          label: "Users",
          value: String(results[3].value.pagination.total),
          detail: "Admin visibility only",
        });
      }

      if (results[4].status === "fulfilled") {
        this.lowStock.set(results[4].value);
      }

      this.metrics.set(nextMetrics);
    } catch {
      this.toast.show("Unable to load dashboard data.", "error");
    } finally {
      this.loading.set(false);
    }
  }
}
