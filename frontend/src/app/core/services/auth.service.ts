import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import type { AuthTokens, AuthSession, UserProfile } from "../models/domain.models";
import { ApiClientService } from "./api-client.service";
import { ToastService } from "./toast.service";

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName?: string;
  phone?: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface CreateStaffPayload extends RegisterPayload {
  role: "ADMIN" | "STAFF";
}

const ACCESS_TOKEN_KEY = "pchub.access_token";
const REFRESH_TOKEN_KEY = "pchub.refresh_token";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly api = inject(ApiClientService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly currentUser = signal<UserProfile | null>(null);
  private readonly accessToken = signal<string | null>(
    localStorage.getItem(ACCESS_TOKEN_KEY),
  );
  private readonly refreshToken = signal<string | null>(
    localStorage.getItem(REFRESH_TOKEN_KEY),
  );
  private refreshPromise: Promise<boolean> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly token = this.accessToken.asReadonly();
  readonly isAuthenticated = computed(() => !!this.accessToken());
  readonly isAdmin = computed(() => this.currentUser()?.role === "ADMIN");
  readonly isStaff = computed(() => {
    const role = this.currentUser()?.role;
    return role === "ADMIN" || role === "STAFF";
  });

  async initialize(): Promise<void> {
    if (!this.refreshToken() && !this.accessToken()) {
      return;
    }

    if (this.accessToken()) {
      try {
        await this.loadProfile();
        return;
      } catch {
        // Fall through to refresh flow.
      }
    }

    const refreshed = await this.refreshSession();
    if (!refreshed) {
      this.clearSession();
      return;
    }

    try {
      await this.loadProfile();
    } catch {
      this.clearSession();
    }
  }

  async login(payload: LoginPayload): Promise<AuthSession> {
    const session = await firstValueFrom(
      this.api.post<AuthSession>("/auth/login", payload),
    );
    this.setSession(session);
    this.toast.show("Signed in successfully", "success");
    return session;
  }

  async register(payload: RegisterPayload): Promise<AuthSession> {
    const session = await firstValueFrom(
      this.api.post<AuthSession>("/auth/register", payload),
    );
    this.setSession(session);
    this.toast.show("Account created", "success");
    return session;
  }

  async loadProfile(): Promise<UserProfile> {
    const profile = await firstValueFrom(this.api.get<UserProfile>("/auth/profile"));
    this.currentUser.set(profile);
    return profile;
  }

  async updateProfile(payload: {
    firstName?: string;
    lastName?: string | null;
    phone?: string | null;
  }): Promise<UserProfile> {
    const profile = await firstValueFrom(
      this.api.put<UserProfile>("/users/profile", payload),
    );
    this.currentUser.set(profile);
    this.toast.show("Profile updated", "success");
    return profile;
  }

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await firstValueFrom(
      this.api.post<{ message: string }>("/auth/change-password", payload),
    );
    this.toast.show("Password changed", "success");
  }

  async logout(): Promise<void> {
    const refreshToken = this.refreshToken();

    try {
      if (refreshToken) {
        await firstValueFrom(
          this.api.post<{ message: string }>("/auth/logout", {
            refreshToken,
          }),
        );
      }
    } finally {
      this.clearSession();
      await this.router.navigateByUrl("/");
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post<{ message: string }>("/auth/logout-all", {}),
      );
    } finally {
      this.clearSession();
      await this.router.navigateByUrl("/");
    }
  }

  async refreshSession(): Promise<boolean> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      return false;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh(refreshToken);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken();
  }

  getRefreshToken(): string | null {
    return this.refreshToken();
  }

  async createStaffUser(payload: CreateStaffPayload): Promise<UserProfile> {
    const profile = await firstValueFrom(
      this.api.post<UserProfile>("/auth/staff", payload),
    );
    this.toast.show("Staff account created", "success");
    return profile;
  }

  private async performRefresh(refreshToken: string): Promise<boolean> {
    try {
      const tokens = await firstValueFrom(
        this.api.post<AuthTokens>("/auth/refresh", {
          refreshToken,
        }),
      );

      this.persistTokens(tokens);
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        const errorMessage = this.readHttpErrorMessage(error);
        this.toast.show(errorMessage, "error");
      }
      this.clearSession();
      return false;
    }
  }

  private setSession(session: AuthSession): void {
    this.currentUser.set(session.user);
    this.persistTokens(session.tokens);
  }

  private persistTokens(tokens: AuthTokens): void {
    this.accessToken.set(tokens.accessToken);
    this.refreshToken.set(tokens.refreshToken);
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }

  private clearSession(): void {
    this.currentUser.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  private readHttpErrorMessage(error: HttpErrorResponse): string {
    const body = error.error;
    if (body && typeof body === "object" && "error" in body) {
      const errorBody = body.error;
      if (
        errorBody &&
        typeof errorBody === "object" &&
        "message" in errorBody &&
        typeof errorBody.message === "string"
      ) {
        return errorBody.message;
      }
    }

    return "Session expired";
  }
}
