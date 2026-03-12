import { Routes } from "@angular/router";
import { authGuard } from "../../core/guards/auth.guard";
import { CatalogPageComponent } from "./catalog-page.component";
import { CustomerLayoutComponent } from "./customer-layout.component";
import { LoginPageComponent } from "./login-page.component";
import { ProductDetailPageComponent } from "./product-detail-page.component";
import { RegisterPageComponent } from "./register-page.component";

export const CUSTOMER_ROUTES: Routes = [
  {
    path: "",
    component: CustomerLayoutComponent,
    children: [
      {
        path: "",
        component: CatalogPageComponent,
      },
      {
        path: "login",
        component: LoginPageComponent,
      },
      {
        path: "register",
        component: RegisterPageComponent,
      },
      {
        path: "products/:slug",
        component: ProductDetailPageComponent,
      },
      {
        path: "cart",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./cart-page.component").then((module) => module.CartPageComponent),
      },
      {
        path: "checkout",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./checkout-page.component").then(
            (module) => module.CheckoutPageComponent,
          ),
      },
      {
        path: "orders",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./orders-page.component").then((module) => module.OrdersPageComponent),
      },
      {
        path: "orders/:id",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./order-detail-page.component").then(
            (module) => module.OrderDetailPageComponent,
          ),
      },
      {
        path: "account",
        canActivate: [authGuard],
        loadComponent: () =>
          import("./account-page.component").then(
            (module) => module.AccountPageComponent,
          ),
      },
    ],
  },
];
