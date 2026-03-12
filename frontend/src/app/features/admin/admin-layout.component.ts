import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <a routerLink="/admin" class="brand-mark">
          <span class="brand-kicker">PC Hub</span>
          <strong>Back Office</strong>
        </a>

        <nav class="admin-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="exactOptions">
            Dashboard
          </a>
          <a routerLink="/admin/products" routerLinkActive="active">Products</a>
          <a routerLink="/admin/categories" routerLinkActive="active">Categories</a>
          <a routerLink="/admin/brands" routerLinkActive="active">Brands</a>
          <a routerLink="/admin/orders" routerLinkActive="active">Orders</a>
          <a routerLink="/admin/payments" routerLinkActive="active">Payments</a>
          <a routerLink="/admin/inventory" routerLinkActive="active">Inventory</a>
          @if (auth.isAdmin()) {
            <a routerLink="/admin/users" routerLinkActive="active">Users</a>
          }
        </nav>

        <div class="admin-sidebar__footer">
          <div class="user-pill">
            <span>{{ displayName() }}</span>
            <small>{{ auth.user()?.role }}</small>
          </div>
          <button type="button" class="ghost-button" (click)="logout()">Sign Out</button>
        </div>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <div>
            <p class="eyebrow">Operations</p>
            <h1>{{ pageTitle() }}</h1>
          </div>
          <a routerLink="/" class="ghost-button">Storefront</a>
        </header>

        <section class="admin-content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly exactOptions = { exact: true };
  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    if (!user) {
      return "Operator";
    }

    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  });
  protected readonly pageTitle = computed(() => {
    const url = this.router.url;

    if (url.includes("/products")) {
      return "Product Operations";
    }
    if (url.includes("/categories")) {
      return "Category Controls";
    }
    if (url.includes("/brands")) {
      return "Brand Controls";
    }
    if (url.includes("/orders")) {
      return "Order Operations";
    }
    if (url.includes("/payments")) {
      return "Payment Review";
    }
    if (url.includes("/inventory")) {
      return "Inventory Desk";
    }
    if (url.includes("/users")) {
      return "User Control";
    }

    return "Operations Dashboard";
  });

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/");
  }
}
