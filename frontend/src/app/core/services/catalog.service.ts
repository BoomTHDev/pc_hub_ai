import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import type { PaginatedData } from "../models/api.models";
import type {
  Brand,
  Category,
  ProductCard,
  ProductDetail,
} from "../models/domain.models";
import type { QueryParams } from "../utils/http";
import { ApiClientService } from "./api-client.service";

export interface ProductFilters extends QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  sortBy?: "name" | "price" | "createdAt";
  sortOrder?: "asc" | "desc";
}

@Injectable({
  providedIn: "root",
})
export class CatalogService {
  private readonly api = inject(ApiClientService);

  getProducts(filters: ProductFilters = {}): Observable<PaginatedData<ProductCard>> {
    return this.api.getPaginated<ProductCard>("/products", filters);
  }

  getProductBySlug(slug: string): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/slug/${slug}`);
  }

  getCategories(): Observable<Category[]> {
    return this.api.get<Category[]>("/categories");
  }

  getBrands(): Observable<Brand[]> {
    return this.api.get<Brand[]>("/brands");
  }
}
