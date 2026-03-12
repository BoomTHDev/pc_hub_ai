import { Component, inject } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { AuthService } from "./core/services/auth.service";
import { ToastStackComponent } from "./shared/toast-stack.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ToastStackComponent],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App {
  private readonly auth = inject(AuthService);

  constructor() {
    void this.auth.initialize();
  }
}
