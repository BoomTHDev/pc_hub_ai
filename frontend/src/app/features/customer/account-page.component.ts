import { CommonModule } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import type { Address } from "../../core/models/domain.models";
import { AuthService } from "../../core/services/auth.service";
import type { AddressPayload } from "../../core/services/customer.service";
import { CustomerService } from "../../core/services/customer.service";
import { ToastService } from "../../core/services/toast.service";

interface AddressFormModel extends AddressPayload {}

function createEmptyAddress(): AddressFormModel {
  return {
    type: "HOME",
    label: "",
    recipientName: "",
    recipientPhone: "",
    line1: "",
    line2: "",
    subDistrict: "",
    district: "",
    province: "",
    postalCode: "",
    isDefault: false,
  };
}

@Component({
  selector: "app-account-page",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="detail-grid">
      <article class="stack-column">
        <section class="panel">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Profile</p>
              <h1>Account settings</h1>
            </div>
          </header>

          <form class="form-grid" (ngSubmit)="saveProfile()">
            <label class="field">
              <span>First name</span>
              <input class="input" name="firstName" [(ngModel)]="profileModel.firstName" required />
            </label>

            <label class="field">
              <span>Last name</span>
              <input class="input" name="lastName" [(ngModel)]="profileModel.lastName" />
            </label>

            <label class="field field-full">
              <span>Phone</span>
              <input class="input" name="phone" [(ngModel)]="profileModel.phone" />
            </label>

            <button type="submit" class="primary-button field-full">Save profile</button>
          </form>
        </section>

        <section class="panel">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Security</p>
              <h2>Change password</h2>
            </div>
          </header>

          <form class="form-grid" (ngSubmit)="changePassword()">
            <label class="field field-full">
              <span>Current password</span>
              <input class="input" type="password" name="currentPassword" [(ngModel)]="passwordModel.currentPassword" required />
            </label>

            <label class="field field-full">
              <span>New password</span>
              <input class="input" type="password" name="newPassword" [(ngModel)]="passwordModel.newPassword" required />
            </label>

            <button type="submit" class="ghost-button field-full">Update password</button>
          </form>
        </section>
      </article>

      <article class="stack-column">
        <section class="panel">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Addresses</p>
              <h2>{{ editingAddressId() ? "Edit address" : "Add address" }}</h2>
            </div>
          </header>

          <form class="form-grid" (ngSubmit)="saveAddress()">
            <label class="field">
              <span>Type</span>
              <select class="input" name="type" [(ngModel)]="addressModel.type">
                <option value="HOME">Home</option>
                <option value="WORK">Work</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label class="field">
              <span>Label</span>
              <input class="input" name="label" [(ngModel)]="addressModel.label" />
            </label>

            <label class="field">
              <span>Recipient</span>
              <input class="input" name="recipientName" [(ngModel)]="addressModel.recipientName" required />
            </label>

            <label class="field">
              <span>Recipient phone</span>
              <input class="input" name="recipientPhone" [(ngModel)]="addressModel.recipientPhone" required />
            </label>

            <label class="field field-full">
              <span>Line 1</span>
              <input class="input" name="line1" [(ngModel)]="addressModel.line1" required />
            </label>

            <label class="field field-full">
              <span>Line 2</span>
              <input class="input" name="line2" [(ngModel)]="addressModel.line2" />
            </label>

            <label class="field">
              <span>Sub-district</span>
              <input class="input" name="subDistrict" [(ngModel)]="addressModel.subDistrict" />
            </label>

            <label class="field">
              <span>District</span>
              <input class="input" name="district" [(ngModel)]="addressModel.district" />
            </label>

            <label class="field">
              <span>Province</span>
              <input class="input" name="province" [(ngModel)]="addressModel.province" required />
            </label>

            <label class="field">
              <span>Postal code</span>
              <input class="input" name="postalCode" [(ngModel)]="addressModel.postalCode" required />
            </label>

            <label class="toggle-field field-full">
              <input type="checkbox" name="isDefault" [(ngModel)]="addressModel.isDefault" />
              <span>Use as default address</span>
            </label>

            <div class="toolbar-actions field-full">
              <button type="submit" class="primary-button">
                {{ editingAddressId() ? "Update address" : "Add address" }}
              </button>
              @if (editingAddressId()) {
                <button type="button" class="ghost-button" (click)="resetAddressForm()">Cancel</button>
              }
            </div>
          </form>
        </section>

        <section class="panel">
          <header class="section-heading">
            <div>
              <p class="eyebrow">Saved addresses</p>
              <h2>{{ addresses().length }} locations</h2>
            </div>
          </header>

          @if (!addresses().length) {
            <div class="empty-panel">No saved addresses yet.</div>
          } @else {
            <div class="stack-list">
              @for (address of addresses(); track address.id) {
                <article class="list-card">
                  <div class="list-card__header">
                    <div>
                      <p class="eyebrow">{{ address.type }}</p>
                      <h3>{{ address.recipientName }}</h3>
                    </div>
                    @if (address.isDefault) {
                      <span class="badge success">Default</span>
                    }
                  </div>
                  <p>{{ address.line1 }}, {{ address.province }} {{ address.postalCode }}</p>
                  <div class="toolbar-actions">
                    <button type="button" class="ghost-button" (click)="startEdit(address)">Edit</button>
                    <button type="button" class="ghost-button danger-text" (click)="deleteAddress(address.id)">Delete</button>
                  </div>
                </article>
              }
            </div>
          }
        </section>
      </article>
    </section>
  `,
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly customerService = inject(CustomerService);
  private readonly toast = inject(ToastService);

  protected readonly addresses = signal<Address[]>([]);
  protected readonly editingAddressId = signal<string | null>(null);

  protected readonly profileModel = {
    firstName: "",
    lastName: "",
    phone: "",
  };
  protected readonly passwordModel = {
    currentPassword: "",
    newPassword: "",
  };
  protected addressModel = createEmptyAddress();

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.profileModel.firstName = user.firstName;
      this.profileModel.lastName = user.lastName ?? "";
      this.profileModel.phone = user.phone ?? "";
    }

    void this.loadAddresses();
  }

  protected async saveProfile(): Promise<void> {
    try {
      await this.auth.updateProfile({
        firstName: this.profileModel.firstName,
        lastName: this.profileModel.lastName || null,
        phone: this.profileModel.phone || null,
      });
    } catch {
      this.toast.show("Unable to update the profile.", "error");
    }
  }

  protected async changePassword(): Promise<void> {
    try {
      await this.auth.changePassword(this.passwordModel);
      this.passwordModel.currentPassword = "";
      this.passwordModel.newPassword = "";
    } catch {
      this.toast.show("Unable to change the password.", "error");
    }
  }

  protected startEdit(address: Address): void {
    this.editingAddressId.set(address.id);
    this.addressModel = {
      type: address.type,
      label: address.label ?? "",
      recipientName: address.recipientName,
      recipientPhone: address.recipientPhone,
      line1: address.line1,
      line2: address.line2 ?? "",
      subDistrict: address.subDistrict ?? "",
      district: address.district ?? "",
      province: address.province,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    };
  }

  protected resetAddressForm(): void {
    this.editingAddressId.set(null);
    this.addressModel = createEmptyAddress();
  }

  protected async saveAddress(): Promise<void> {
    try {
      const payload: AddressPayload = {
        ...this.addressModel,
        label: this.addressModel.label || undefined,
        line2: this.addressModel.line2 || undefined,
        subDistrict: this.addressModel.subDistrict || undefined,
        district: this.addressModel.district || undefined,
      };

      const editingAddressId = this.editingAddressId();
      if (editingAddressId) {
        await firstValueFrom(
          this.customerService.updateAddress(editingAddressId, payload),
        );
        this.toast.show("Address updated", "success");
      } else {
        await firstValueFrom(this.customerService.createAddress(payload));
        this.toast.show("Address added", "success");
      }

      this.resetAddressForm();
      await this.loadAddresses();
    } catch {
      this.toast.show("Unable to save the address.", "error");
    }
  }

  protected async deleteAddress(addressId: string): Promise<void> {
    if (!window.confirm("Delete this address?")) {
      return;
    }

    try {
      await firstValueFrom(this.customerService.deleteAddress(addressId));
      this.toast.show("Address deleted", "success");
      await this.loadAddresses();
    } catch {
      this.toast.show("Unable to delete that address.", "error");
    }
  }

  private async loadAddresses(): Promise<void> {
    try {
      const addresses = await firstValueFrom(this.customerService.getAddresses());
      this.addresses.set(addresses);
    } catch {
      this.toast.show("Unable to load addresses.", "error");
    }
  }
}
