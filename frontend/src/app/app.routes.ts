import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "admin",
    loadChildren: () =>
      import("./features/admin/admin.routes").then((module) => module.ADMIN_ROUTES),
  },
  {
    path: "",
    loadChildren: () =>
      import("./features/customer/customer.routes").then(
        (module) => module.CUSTOMER_ROUTES,
      ),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
