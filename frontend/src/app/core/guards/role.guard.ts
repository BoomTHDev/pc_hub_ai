import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import type { UserRole } from "../models/domain.models";
import { AuthService } from "../services/auth.service";

function isUserRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "STAFF" || value === "CUSTOMER";
}

function readRequiredRoles(data: Record<string, object | string | number | boolean | undefined>): UserRole[] {
  const value = data["roles"];
  if (!Array.isArray(value)) {
    return [];
  }

  const roles: UserRole[] = [];
  for (const item of value) {
    if (typeof item === "string" && isUserRole(item)) {
      roles.push(item);
    }
  }

  return roles;
}

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles = readRequiredRoles(route.data);
  const userRole = auth.user()?.role;

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(["/login"]);
  }

  if (userRole && requiredRoles.includes(userRole)) {
    return true;
  }

  return router.createUrlTree(["/"]);
};
