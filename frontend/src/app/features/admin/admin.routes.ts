import { Routes } from "@angular/router";
import { authGuard } from "../../core/guards/auth.guard";
import { roleGuard } from "../../core/guards/role.guard";
import { AdminLayoutComponent } from "./admin-layout.component";
import { BrandsPageComponent } from "./brands-page.component";
import { CategoriesPageComponent } from "./categories-page.component";
import { DashboardPageComponent } from "./dashboard-page.component";
import { UsersPageComponent } from "./users-page.component";

export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ["ADMIN", "STAFF"],
    },
    children: [
      {
        path: "",
        component: DashboardPageComponent,
      },
      {
        path: "products",
        loadComponent: () =>
          import("./products-page.component").then(
            (module) => module.ProductsPageComponent,
          ),
      },
      {
        path: "categories",
        component: CategoriesPageComponent,
      },
      {
        path: "brands",
        component: BrandsPageComponent,
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./orders-page.component").then((module) => module.OrdersPageComponent),
      },
      {
        path: "payments",
        loadComponent: () =>
          import("./payments-page.component").then(
            (module) => module.PaymentsPageComponent,
          ),
      },
      {
        path: "inventory",
        loadComponent: () =>
          import("./inventory-page.component").then(
            (module) => module.InventoryPageComponent,
          ),
      },
      {
        path: "users",
        component: UsersPageComponent,
        canActivate: [roleGuard],
        data: {
          roles: ["ADMIN"],
        },
      },
    ],
  },
];
