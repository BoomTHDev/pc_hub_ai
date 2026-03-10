import { Injectable, signal } from "@angular/core";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({
  providedIn: "root",
})
export class ToastService {
  private readonly nextId = signal(1);
  private readonly toastItems = signal<ToastItem[]>([]);

  readonly toasts = this.toastItems.asReadonly();

  show(message: string, type: ToastType = "info"): void {
    const id = this.nextId();
    this.nextId.update((value) => value + 1);

    this.toastItems.update((items) => [...items, { id, type, message }]);

    window.setTimeout(() => {
      this.dismiss(id);
    }, 3500);
  }

  dismiss(id: number): void {
    this.toastItems.update((items) => items.filter((item) => item.id !== id));
  }
}
