import { CommonModule } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-customer-layout",
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="site-shell">
      <header class="site-header">
        <a routerLink="/" class="brand-mark">
          <span class="brand-kicker">PC Hub</span>
          <strong>Builds that move fast.</strong>
        </a>

        <nav class="site-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="exactOptions">
            Catalog
          </a>
          @if (auth.isAuthenticated()) {
            <a routerLink="/cart" routerLinkActive="active">Cart</a>
            <a routerLink="/orders" routerLinkActive="active">Orders</a>
            <a routerLink="/account" routerLinkActive="active">Account</a>
          }
          @if (auth.isStaff()) {
            <a routerLink="/admin" routerLinkActive="active">Back Office</a>
          }
        </nav>

        <div class="header-actions">
          @if (auth.isAuthenticated()) {
            <div class="user-pill">
              <span>{{ displayName() }}</span>
              <small>{{ auth.user()?.role }}</small>
            </div>
            <button type="button" class="ghost-button" (click)="logout()">
              Sign Out
            </button>
          } @else {
            <a routerLink="/login" class="ghost-button">Sign In</a>
            <a routerLink="/register" class="primary-button">Create Account</a>
          }
        </div>
      </header>

      <main class="page-shell">
        <router-outlet />
      </main>

      <footer class="site-footer">
        <p>PC Hub storefront and operations console for catalog, checkout, and fulfillment.</p>
        <span>Angular 21 + Express + Prisma</span>
      </footer>
    </div>
  `,
})
export class CustomerLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly exactOptions = { exact: true };
  protected readonly displayName = computed(() => {
    const user = this.auth.user();
    if (!user) {
      return "Guest";
    }

    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  });

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl("/");
  }
}
