import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, from, switchMap, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh") ||
    url.includes("/auth/logout")
  );
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const accessToken = auth.getAccessToken();

  const authenticatedRequest =
    accessToken && !isAuthEndpoint(req.url)
      ? req.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : req;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        isAuthEndpoint(req.url) ||
        !auth.getRefreshToken()
      ) {
        return throwError(() => error);
      }

      return from(auth.refreshSession()).pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            void router.navigateByUrl("/login");
            return throwError(() => error);
          }

          const nextAccessToken = auth.getAccessToken();
          if (!nextAccessToken) {
            return throwError(() => error);
          }

          return next(
            req.clone({
              setHeaders: {
                Authorization: `Bearer ${nextAccessToken}`,
              },
            }),
          );
        }),
      );
    }),
  );
};
