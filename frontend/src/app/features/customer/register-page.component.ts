import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-register-page",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="split-hero">
      <article class="hero-card accent">
        <p class="eyebrow">New Customer</p>
        <h1>Set up your account and keep every build, cart, and address in one place.</h1>
        <ul class="bullet-list">
          <li>Save addresses for faster checkout.</li>
          <li>Track PromptPay and COD orders in one view.</li>
          <li>Return later with your cart and order history intact.</li>
        </ul>
      </article>

      <article class="form-card">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Create Account</p>
            <h2>Join PC Hub</h2>
          </div>
        </header>

        <form class="form-grid" (ngSubmit)="submit()">
          <label class="field">
            <span>First name</span>
            <input class="input" name="firstName" [(ngModel)]="model.firstName" required />
          </label>

          <label class="field">
            <span>Last name</span>
            <input class="input" name="lastName" [(ngModel)]="model.lastName" />
          </label>

          <label class="field">
            <span>Email</span>
            <input class="input" type="email" name="email" [(ngModel)]="model.email" required />
          </label>

          <label class="field">
            <span>Phone</span>
            <input class="input" name="phone" [(ngModel)]="model.phone" />
          </label>

          <label class="field field-full">
            <span>Password</span>
            <input
              class="input"
              type="password"
              name="password"
              [(ngModel)]="model.password"
              required
            />
          </label>

          <button type="submit" class="primary-button field-full" [disabled]="submitting()">
            {{ submitting() ? "Creating..." : "Create Account" }}
          </button>
        </form>

        <p class="support-copy">
          Already have an account?
          <a routerLink="/login">Sign in</a>
        </p>
      </article>
    </section>
  `,
})
export class RegisterPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly submitting = signal(false);
  protected readonly model = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  };

  protected async submit(): Promise<void> {
    this.submitting.set(true);

    try {
      await this.auth.register({
        firstName: this.model.firstName,
        lastName: this.model.lastName || undefined,
        email: this.model.email,
        phone: this.model.phone || undefined,
        password: this.model.password,
      });
      await this.router.navigateByUrl("/");
    } catch {
      this.toast.show("Unable to create the account.", "error");
    } finally {
      this.submitting.set(false);
    }
  }
}
