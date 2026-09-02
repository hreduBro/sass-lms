export type GridViewMode = 'grid' | 'table';

export type GridEmptyStateType = 'none' | 'true_empty' | 'search_miss' | 'filter_miss';

export interface GridActiveChip {
  id: string;
  label: string;
  value: string;
  data?: any;
}

export interface GridPaginationConfig {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  itemLabel?: string;
}
