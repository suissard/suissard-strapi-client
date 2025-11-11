export type StrapiFindFunction<T> = (value: T, id: string) => boolean;

export interface StrapiListRequest<T> {
  filters?: Record<string, any>;
  fields?: (keyof T)[];
  populate?: string[] | string;
  force?: boolean;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface StrapiMeta {
  pagination: StrapiPagination;
}

export interface StrapiListResponse<T> {
  data: T[];
  meta: StrapiMeta;
}
