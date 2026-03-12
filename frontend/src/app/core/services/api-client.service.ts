import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { map, Observable } from "rxjs";
import { API_BASE_URL } from "../config/api.config";
import type {
  ApiSuccessResponse,
  PaginatedData,
} from "../models/api.models";
import { buildHttpParams } from "../utils/http";
import type { QueryParams } from "../utils/http";

@Injectable({
  providedIn: "root",
})
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  get<T>(
    path: string,
    query?: QueryParams,
  ): Observable<T> {
    return this.http
      .get<ApiSuccessResponse<T>>(this.url(path), {
        params: buildHttpParams(query),
      })
      .pipe(map((response) => response.data));
  }

  getPaginated<T>(
    path: string,
    query?: QueryParams,
  ): Observable<PaginatedData<T>> {
    return this.http
      .get<ApiSuccessResponse<T[]>>(this.url(path), {
        params: buildHttpParams(query),
      })
      .pipe(
        map((response) => ({
          items: response.data,
          pagination: response.meta?.pagination ?? {
            total: response.data.length,
            page: 1,
            limit: response.data.length,
            totalPages: 1,
          },
        })),
      );
  }

  post<T>(path: string, body: object | FormData): Observable<T> {
    return this.http
      .post<ApiSuccessResponse<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: object): Observable<T> {
    return this.http
      .put<ApiSuccessResponse<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  patch<T>(path: string, body: object): Observable<T> {
    return this.http
      .patch<ApiSuccessResponse<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiSuccessResponse<T>>(this.url(path))
      .pipe(map((response) => response.data));
  }

  private url(path: string): string {
    if (path.startsWith("http")) {
      return path;
    }

    return `${this.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }
}
