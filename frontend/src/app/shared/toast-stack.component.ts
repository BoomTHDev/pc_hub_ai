import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ToastService } from "../core/services/toast.service";

@Component({
  selector: "app-toast-stack",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <article class="toast" [class]="toast.type">
          <div>
            <strong>{{ toast.type | titlecase }}</strong>
            <p>{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="ghost-button"
            (click)="toastService.dismiss(toast.id)"
          >
            Dismiss
          </button>
        </article>
      }
    </section>
  `,
})
export class ToastStackComponent {
  protected readonly toastService = inject(ToastService);
}
