export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    pagination?: Pagination;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: object | string | number | boolean | null;
  };
}

export interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

export interface RequestState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
