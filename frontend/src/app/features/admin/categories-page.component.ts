import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { Category } from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-categories-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Category Desk</p>
            <h2>{{ editingId() ? "Edit category" : "Create category" }}</h2>
          </div>
        </header>

        <form class="form-stack" (ngSubmit)="saveCategory()">
          <label class="field">
            <span>Name</span>
            <input class="input" name="name" [(ngModel)]="model.name" required />
          </label>

          <label class="field">
            <span>Description</span>
            <textarea class="input" rows="5" name="description" [(ngModel)]="model.description"></textarea>
          </label>

          <div class="toolbar-actions">
            <button type="submit" class="primary-button">
              {{ editingId() ? "Update category" : "Create category" }}
            </button>
            @if (editingId()) {
              <button type="button" class="ghost-button" (click)="resetForm()">Cancel</button>
            }
          </div>
        </form>
      </article>

      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Existing categories</p>
            <h2>{{ categories().length }} records</h2>
          </div>
        </header>

        <div class="stack-list">
          @for (category of categories(); track category.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <h3>{{ category.name }}</h3>
                  <p>{{ category.description || "No description" }}</p>
                </div>
                <span class="badge neutral">
                  {{ category._count?.products ?? 0 }} products
                </span>
              </div>
              <div class="toolbar-actions">
                <button type="button" class="ghost-button" (click)="editCategory(category)">Edit</button>
                <button type="button" class="ghost-button danger-text" (click)="deleteCategory(category.id)">Delete</button>
              </div>
            </article>
          }
        </div>
      </article>
    </section>
  `,
})
export class CategoriesPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly categories = signal<Category[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly model = {
    name: "",
    description: "",
  };

  constructor() {
    void this.loadCategories();
  }

  protected editCategory(category: Category): void {
    this.editingId.set(category.id);
    this.model.name = category.name;
    this.model.description = category.description ?? "";
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.model.name = "";
    this.model.description = "";
  }

  protected async saveCategory(): Promise<void> {
    try {
      const editingId = this.editingId();
      if (editingId) {
        await firstValueFrom(
          this.adminService.updateCategory(editingId, {
            name: this.model.name,
            description: this.model.description || null,
          }),
        );
        this.toast.show("Category updated", "success");
      } else {
        await firstValueFrom(
          this.adminService.createCategory({
            name: this.model.name,
            description: this.model.description || undefined,
          }),
        );
        this.toast.show("Category created", "success");
      }

      this.resetForm();
      await this.loadCategories();
    } catch {
      this.toast.show("Unable to save category.", "error");
    }
  }

  protected async deleteCategory(categoryId: string): Promise<void> {
    if (!window.confirm("Delete this category?")) {
      return;
    }

    try {
      await firstValueFrom(this.adminService.deleteCategory(categoryId));
      this.toast.show("Category deleted", "success");
      await this.loadCategories();
    } catch {
      this.toast.show("Unable to delete category.", "error");
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      const categories = await firstValueFrom(this.adminService.getCategories());
      this.categories.set(categories);
    } catch {
      this.toast.show("Unable to load categories.", "error");
    }
  }
}
