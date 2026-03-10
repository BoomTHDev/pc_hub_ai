import { HttpParams } from "@angular/common/http";

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = {
  [key: string]: QueryValue;
};

export function buildHttpParams(
  query?: QueryParams,
): HttpParams {
  let params = new HttpParams();

  if (!query) {
    return params;
  }

  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    params = params.set(key, String(value));
  }

  return params;
}
