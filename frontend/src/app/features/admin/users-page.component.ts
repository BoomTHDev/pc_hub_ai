import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { UserProfile } from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { AuthService } from "../../core/services/auth.service";
import { ToastService } from "../../core/services/toast.service";
import { roleLabel } from "../../core/utils/status";

@Component({
  selector: "app-users-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Staff Creation</p>
            <h2>Create admin or staff accounts</h2>
          </div>
        </header>

        <form class="form-grid" (ngSubmit)="createStaff()">
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

          <label class="field">
            <span>Password</span>
            <input class="input" type="password" name="password" [(ngModel)]="model.password" required />
          </label>

          <label class="field">
            <span>Role</span>
            <select class="input" name="role" [(ngModel)]="model.role">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button type="submit" class="primary-button field-full">Create account</button>
        </form>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">User Control</p>
            <h2>{{ users().length }} users loaded</h2>
          </div>
        </header>

        <div class="stack-list">
          @for (user of users(); track user.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <h3>{{ user.firstName }} {{ user.lastName }}</h3>
                  <p>{{ user.email }}</p>
                </div>
                <span class="badge" [class]="user.isActive ? 'success' : 'danger'">
                  {{ user.isActive ? "Active" : "Disabled" }}
                </span>
              </div>
              <div class="summary-row">
                <span>{{ roleLabel(user.role) }}</span>
                @if (canToggle(user)) {
                  <button type="button" class="ghost-button" (click)="toggleUser(user)">
                    {{ user.isActive ? "Disable" : "Enable" }}
                  </button>
                }
              </div>
            </article>
          }
        </div>
      </article>
    </section>
  `,
})
export class UsersPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<UserProfile[]>([]);
  protected readonly roleLabel = roleLabel;
  protected readonly model: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    role: "STAFF" | "ADMIN";
  } = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF",
  };

  constructor() {
    void this.loadUsers();
  }

  protected canToggle(user: UserProfile): boolean {
    return user.id !== this.authService.user()?.id;
  }

  protected async createStaff(): Promise<void> {
    try {
      await this.authService.createStaffUser({
        firstName: this.model.firstName,
        lastName: this.model.lastName || undefined,
        email: this.model.email,
        phone: this.model.phone || undefined,
        password: this.model.password,
        role: this.model.role,
      });
      this.model.firstName = "";
      this.model.lastName = "";
      this.model.email = "";
      this.model.phone = "";
      this.model.password = "";
      this.model.role = "STAFF";
      await this.loadUsers();
    } catch {
      this.toast.show("Unable to create that staff account.", "error");
    }
  }

  protected async toggleUser(user: UserProfile): Promise<void> {
    try {
      await firstValueFrom(
        this.adminService.toggleUserActive(user.id, !user.isActive),
      );
      this.toast.show("User status updated", "success");
      await this.loadUsers();
    } catch {
      this.toast.show("Unable to update that user.", "error");
    }
  }

  private async loadUsers(): Promise<void> {
    try {
      const result = await firstValueFrom(this.adminService.getUsers({ limit: 50 }));
      this.users.set(result.items);
    } catch {
      this.toast.show("Unable to load users.", "error");
    }
  }
}
