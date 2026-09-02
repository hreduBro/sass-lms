import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { SkillCluster, Skill } from '../../../models/skill-mapping.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';
import { GridViewMode } from '../../../components/data-grid/data-grid.types';

@Component({
  selector: 'app-skill-clusters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomSelectComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  templateUrl: './skill-clusters.component.html'
})
export class SkillClustersComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private fb = inject(FormBuilder);

  // Search and Filter State
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedSkillsFilter = signal<string>('all'); // 'all' | 'has_skills' | 'empty'
  selectedSortBy = signal<string>('name_asc');   // 'name_asc' | 'name_desc' | 'most_skills' | 'least_skills' | 'created_desc'
  isFilterPanelOpen = signal<boolean>(false);

  // Pagination & View Mode
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  viewMode = signal<GridViewMode>('table');

  // Modals state
  isClusterModalOpen = signal<boolean>(false);
  editingCluster = signal<SkillCluster | null>(null);
  clusterForm!: FormGroup;
  formSubmitted = signal<boolean>(false);
  formError = signal<string | null>(null);

  // Active Action Menu state
  activeMenuCluster = signal<SkillCluster | null>(null);
  menuPosition = signal<{ top: number; left: number }>({ top: 0, left: 0 });

  // Confirmation dialog
  confirmDialog = signal<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDestructive: boolean;
    clusterId: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    clusterId: ''
  });

  // Select Options
  statusSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'list' },
    { value: 'active', label: 'Active', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-500/10 text-emerald-600' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-rose-500/10 text-rose-600' }
  ];

  skillsFilterSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Clusters', icon: 'bubble_chart' },
    { value: 'has_skills', label: 'With Assigned Skills (≥1)', icon: 'psychology' },
    { value: 'empty', label: 'No Skills Assigned (0)', icon: 'layers_clear' }
  ];

  sortBySelectOptions: SelectOption[] = [
    { value: 'name_asc', label: 'Cluster Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'name_desc', label: 'Cluster Name (Z-A)', icon: 'sort_by_alpha' },
    { value: 'most_skills', label: 'Most Skills Assigned', icon: 'psychology' },
    { value: 'least_skills', label: 'Fewest Skills Assigned', icon: 'layers_clear' },
    { value: 'created_desc', label: 'Recently Created', icon: 'schedule' }
  ];

  ngOnInit() {
    this.initClusterForm();
  }

  private initClusterForm() {
    this.clusterForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(99)]],
      description: ['', [Validators.maxLength(500)]],
      status: ['active', Validators.required]
    });
  }

  getSkillsForCluster(clusterId: string): Skill[] {
    return this.lmsData.skills().filter(s => s.clusterId === clusterId);
  }

  // Active Filter Count
  activeFilterCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedSkillsFilter() !== 'all') count++;
    if (this.selectedSortBy() !== 'name_asc') count++;
    return count;
  });

  // Quick statistics for filter chips
  totalClustersCount = computed(() => this.lmsData.skillClusters().length);
  activeClustersCount = computed(() => this.lmsData.skillClusters().filter(c => (c.status || 'active') === 'active').length);
  inactiveClustersCount = computed(() => this.lmsData.skillClusters().filter(c => c.status === 'inactive').length);
  withSkillsCount = computed(() => this.lmsData.skillClusters().filter(c => this.getSkillsForCluster(c.clusterId).length > 0).length);
  emptyClustersCount = computed(() => this.lmsData.skillClusters().filter(c => this.getSkillsForCluster(c.clusterId).length === 0).length);

  // Filtered clusters
  filteredClusters = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const skillsFilter = this.selectedSkillsFilter();
    const sortBy = this.selectedSortBy();

    let list = this.lmsData.skillClusters();

    // Text search
    if (q) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        c.clusterCode.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (status !== 'all') {
      list = list.filter(c => (c.status || 'active') === status);
    }

    // Skills assigned filter
    if (skillsFilter === 'has_skills') {
      list = list.filter(c => this.getSkillsForCluster(c.clusterId).length > 0);
    } else if (skillsFilter === 'empty') {
      list = list.filter(c => this.getSkillsForCluster(c.clusterId).length === 0);
    }

    // Sorting
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'most_skills': {
          const aCount = this.getSkillsForCluster(a.clusterId).length;
          const bCount = this.getSkillsForCluster(b.clusterId).length;
          return bCount - aCount;
        }
        case 'least_skills': {
          const aCount = this.getSkillsForCluster(a.clusterId).length;
          const bCount = this.getSkillsForCluster(b.clusterId).length;
          return aCount - bCount;
        }
        case 'created_desc':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return list;
  });

  // Paginated clusters
  paginatedClusters = computed(() => {
    const list = this.filteredClusters();
    const start = (this.currentPage() - 1) * this.pageSize();
    return list.slice(start, start + this.pageSize());
  });

  emptyStateType = computed<'no-data' | 'no-results'>(() => {
    return this.lmsData.skillClusters().length === 0 ? 'no-data' : 'no-results';
  });

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.currentPage.set(1);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedSkillsFilter.set('all');
    this.selectedSortBy.set('name_asc');
    this.currentPage.set(1);
  }

  openCreateClusterModal() {
    this.editingCluster.set(null);
    this.clusterForm.reset({
      name: '',
      description: '',
      status: 'active'
    });
    this.formSubmitted.set(false);
    this.formError.set(null);
    this.isClusterModalOpen.set(true);
  }

  openEditClusterModal(cluster: SkillCluster) {
    this.editingCluster.set(cluster);
    this.clusterForm.patchValue({
      name: cluster.name,
      description: cluster.description || '',
      status: cluster.status || 'active'
    });
    this.formSubmitted.set(false);
    this.formError.set(null);
    this.isClusterModalOpen.set(true);
    this.closeMenu();
  }

  closeClusterModal() {
    this.isClusterModalOpen.set(false);
    this.editingCluster.set(null);
  }

  saveCluster() {
    this.formSubmitted.set(true);
    if (this.clusterForm.invalid) {
      this.formError.set('Please provide a valid cluster name.');
      return;
    }

    const val = this.clusterForm.value;
    const editing = this.editingCluster();

    this.lmsData.saveCluster({
      clusterId: editing?.clusterId,
      clusterCode: editing?.clusterCode,
      name: val.name.trim(),
      description: val.description ? val.description.trim() : '',
      status: val.status
    });

    this.closeClusterModal();
  }

  confirmDeleteCluster(cluster: SkillCluster) {
    this.closeMenu();
    const skillsInCluster = this.getSkillsForCluster(cluster.clusterId).length;
    const warnMsg = skillsInCluster > 0
      ? `This cluster contains ${skillsInCluster} skill(s). Deleting it will leave those skills uncategorized. Are you sure you want to delete "${cluster.name}"?`
      : `Are you sure you want to delete competency cluster "${cluster.name}"? This action cannot be undone.`;

    this.confirmDialog.set({
      isOpen: true,
      title: 'Delete Competency Cluster',
      message: warnMsg,
      confirmText: 'Delete Cluster',
      isDestructive: true,
      clusterId: cluster.clusterId
    });
  }

  closeConfirmDialog() {
    this.confirmDialog.update(d => ({ ...d, isOpen: false }));
  }

  executeConfirmAction() {
    const dialog = this.confirmDialog();
    if (dialog.clusterId) {
      this.lmsData.deleteCluster(dialog.clusterId);
    }
    this.closeConfirmDialog();
  }

  // Action Menu toggle
  toggleMenu(cluster: SkillCluster, event: MouseEvent) {
    event.stopPropagation();
    if (this.activeMenuCluster()?.clusterId === cluster.clusterId) {
      this.closeMenu();
      return;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 120;
    const padding = 12;

    let left = rect.right - menuWidth;
    let top = rect.bottom + 6;

    if (left < padding) left = padding;
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    if (top + menuHeight > window.innerHeight - padding) {
      top = rect.top - menuHeight - 6;
    }

    this.menuPosition.set({ top, left });
    this.activeMenuCluster.set(cluster);
  }

  closeMenu() {
    this.activeMenuCluster.set(null);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.cluster-action-menu-dropdown') && !target.closest('.cluster-action-menu-btn')) {
      this.closeMenu();
    }
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange() {
    if (this.activeMenuCluster()) {
      this.closeMenu();
    }
  }
}
