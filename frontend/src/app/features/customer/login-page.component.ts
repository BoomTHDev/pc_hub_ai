import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-login-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="split-hero">
      <article class="hero-card">
        <p class="eyebrow">Customer Access</p>
        <h1>Sign in to continue cart, checkout, and order tracking.</h1>
        <p class="hero-copy">
          Staff and admins can use the same login and jump directly into the back office.
        </p>
      </article>

      <article class="form-card">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Sign In</p>
            <h2>Welcome back</h2>
          </div>
        </header>

        <form class="form-stack" (ngSubmit)="submit()">
          <label class="field">
            <span>Email</span>
            <input
              class="input"
              type="email"
              name="email"
              [(ngModel)]="model.email"
              required
            />
          </label>

          <label class="field">
            <span>Password</span>
            <input
              class="input"
              type="password"
              name="password"
              [(ngModel)]="model.password"
              required
            />
          </label>

          <button type="submit" class="primary-button" [disabled]="submitting()">
            {{ submitting() ? "Signing in..." : "Sign In" }}
          </button>
        </form>

        <p class="support-copy">
          Need a customer account?
          <a routerLink="/register">Create one now</a>
        </p>
      </article>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly submitting = signal(false);
  protected readonly model = {
    email: "",
    password: "",
  };

  protected async submit(): Promise<void> {
    this.submitting.set(true);

    try {
      const session = await this.auth.login(this.model);
      const redirect = this.route.snapshot.queryParamMap.get("redirect");

      if (redirect) {
        await this.router.navigateByUrl(redirect);
      } else if (session.user.role === "ADMIN" || session.user.role === "STAFF") {
        await this.router.navigateByUrl("/admin");
      } else {
        await this.router.navigateByUrl("/");
      }
    } catch {
      this.toast.show("Unable to sign in with those credentials.", "error");
    } finally {
      this.submitting.set(false);
    }
  }
}
