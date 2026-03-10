import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { Brand } from "../../core/models/domain.models";
import { AdminService } from "../../core/services/admin.service";
import { ToastService } from "../../core/services/toast.service";

@Component({
  selector: "app-brands-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="detail-grid">
      <article class="panel">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Brand Desk</p>
            <h2>{{ editingId() ? "Edit brand" : "Create brand" }}</h2>
          </div>
        </header>

        <form class="form-stack" (ngSubmit)="saveBrand()">
          <label class="field">
            <span>Name</span>
            <input class="input" name="name" [(ngModel)]="model.name" required />
          </label>

          <label class="field">
            <span>Website</span>
            <input class="input" name="website" [(ngModel)]="model.website" />
          </label>

          <label class="field">
            <span>Description</span>
            <textarea class="input" rows="5" name="description" [(ngModel)]="model.description"></textarea>
          </label>

          <div class="toolbar-actions">
            <button type="submit" class="primary-button">
              {{ editingId() ? "Update brand" : "Create brand" }}
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
            <p class="eyebrow">Existing brands</p>
            <h2>{{ brands().length }} records</h2>
          </div>
        </header>

        <div class="stack-list">
          @for (brand of brands(); track brand.id) {
            <article class="list-card">
              <div class="list-card__header">
                <div>
                  <h3>{{ brand.name }}</h3>
                  <p>{{ brand.website || brand.description || "No details" }}</p>
                </div>
                <span class="badge neutral">
                  {{ brand._count?.products ?? 0 }} products
                </span>
              </div>
              <div class="toolbar-actions">
                <button type="button" class="ghost-button" (click)="editBrand(brand)">Edit</button>
                <button type="button" class="ghost-button danger-text" (click)="deleteBrand(brand.id)">Delete</button>
              </div>
            </article>
          }
        </div>
      </article>
    </section>
  `,
})
export class BrandsPageComponent {
  private readonly adminService = inject(AdminService);
  private readonly toast = inject(ToastService);

  protected readonly brands = signal<Brand[]>([]);
  protected readonly editingId = signal<string | null>(null);
  protected readonly model = {
    name: "",
    description: "",
    website: "",
  };

  constructor() {
    void this.loadBrands();
  }

  protected editBrand(brand: Brand): void {
    this.editingId.set(brand.id);
    this.model.name = brand.name;
    this.model.description = brand.description ?? "";
    this.model.website = brand.website ?? "";
  }

  protected resetForm(): void {
    this.editingId.set(null);
    this.model.name = "";
    this.model.description = "";
    this.model.website = "";
  }

  protected async saveBrand(): Promise<void> {
    try {
      const editingId = this.editingId();
      if (editingId) {
        await firstValueFrom(
          this.adminService.updateBrand(editingId, {
            name: this.model.name,
            description: this.model.description || null,
            website: this.model.website || null,
          }),
        );
        this.toast.show("Brand updated", "success");
      } else {
        await firstValueFrom(
          this.adminService.createBrand({
            name: this.model.name,
            description: this.model.description || undefined,
            website: this.model.website || undefined,
          }),
        );
        this.toast.show("Brand created", "success");
      }

      this.resetForm();
      await this.loadBrands();
    } catch {
      this.toast.show("Unable to save brand.", "error");
    }
  }

  protected async deleteBrand(brandId: string): Promise<void> {
    if (!window.confirm("Delete this brand?")) {
      return;
    }

    try {
      await firstValueFrom(this.adminService.deleteBrand(brandId));
      this.toast.show("Brand deleted", "success");
      await this.loadBrands();
    } catch {
      this.toast.show("Unable to delete brand.", "error");
    }
  }

  private async loadBrands(): Promise<void> {
    try {
      const brands = await firstValueFrom(this.adminService.getBrands());
      this.brands.set(brands);
    } catch {
      this.toast.show("Unable to load brands.", "error");
    }
  }
}
