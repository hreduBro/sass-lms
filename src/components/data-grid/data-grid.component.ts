import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridViewMode, GridEmptyStateType, GridActiveChip } from './data-grid.types';

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block w-full',
  },
})
export class DataGridComponent {
  // --- Search ---
  searchQuery = model<string>('');
  searchPlaceholder = input<string>('Search...');
  showSearch = input<boolean>(true);

  // --- Filter Panel Toggle ---
  isFilterOpen = model<boolean>(false);
  showFilterToggle = input<boolean>(true);
  filterLabel = input<string>('Filters');
  activeFilterCount = input<number>(0);
  hasActiveFilters = input<boolean>(false);

  // --- Reset Button ---
  showReset = input<boolean>(false);
  resetLabel = input<string>('Reset');

  // --- View Switcher ---
  viewMode = model<GridViewMode>('grid');
  showViewSwitcher = input<boolean>(false);

  // --- Header Count Summary ---
  itemCountText = input<string>('');

  // --- Filter Drawer Panel ---
  filterPanelTitle = input<string>('');
  filterPanelSubtitle = input<string>('Combine criteria with AND • Multiple values in same category with OR');
  showFilterFooter = input<boolean>(true);
  clearFilterLabel = input<string>('Clear All Selections');
  cancelFilterLabel = input<string>('Cancel');
  applyFilterLabel = input<string>('Apply Filter');

  // --- Active Filter Chips ---
  activeChips = input<GridActiveChip[]>([]);

  // --- Empty States ---
  emptyStateType = input<GridEmptyStateType>('none');
  emptyTitle = input<string>('No records found');
  emptyMessage = input<string>('No data is currently available.');
  emptyIcon = input<string>('folder_off');
  emptyActionText = input<string>('');
  emptyActionIcon = input<string>('add_circle');

  // --- Pagination ---
  showPagination = input<boolean>(true);
  currentPage = model<number>(1);
  pageSize = model<number>(6);
  totalItems = input<number>(0);
  pageSizeOptions = input<number[]>([6, 9, 12, 24]);
  itemLabel = input<string>('items');
  customFooterText = input<string>('');

  // --- Events ---
  searchChange = output<string>();
  filterToggle = output<boolean>();
  resetGrid = output<void>();
  clearFilters = output<void>();
  cancelFilters = output<void>();
  applyFilters = output<void>();
  removeChip = output<GridActiveChip>();
  clearAllChips = output<void>();
  emptyAction = output<void>();
  pageChange = output<number>();
  pageSizeChange = output<number>();

  // --- Pagination Computations ---
  totalPages = computed(() => {
    const total = this.totalItems();
    const size = this.pageSize();
    if (total <= 0 || size <= 0) return 1;
    return Math.max(1, Math.ceil(total / size));
  });

  startItemIndex = computed(() => {
    if (this.totalItems() === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItemIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  });

  pagesList = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  // --- Handlers ---
  onSearchInput(value: string) {
    this.searchQuery.set(value);
    this.searchChange.emit(value);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchChange.emit('');
  }

  toggleFilter() {
    const nextState = !this.isFilterOpen();
    this.isFilterOpen.set(nextState);
    this.filterToggle.emit(nextState);
  }

  onResetClick() {
    this.resetGrid.emit();
  }

  onClearFilterClick() {
    this.clearFilters.emit();
  }

  onCancelFilterClick() {
    this.isFilterOpen.set(false);
    this.cancelFilters.emit();
  }

  onApplyFilterClick() {
    this.applyFilters.emit();
  }

  onChipRemove(chip: GridActiveChip) {
    this.removeChip.emit(chip);
  }

  onClearAllChips() {
    this.clearAllChips.emit();
  }

  onEmptyActionClick() {
    this.emptyAction.emit();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.pageChange.emit(page);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      const p = this.currentPage() - 1;
      this.currentPage.set(p);
      this.pageChange.emit(p);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      const p = this.currentPage() + 1;
      this.currentPage.set(p);
      this.pageChange.emit(p);
    }
  }

  onPageSizeSelect(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.pageSizeChange.emit(size);
    this.pageChange.emit(1);
  }
}
