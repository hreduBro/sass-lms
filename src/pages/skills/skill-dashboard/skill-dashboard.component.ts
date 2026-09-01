import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { Skill, SkillCluster, SkillMapping, LearnerSkillProgress, SkillChangeLog } from '../../../models/skill-mapping.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';

export interface SkillWidgetConfig {
  id: string;
  type: 'kpi' | 'status_breakdown' | 'cluster_distribution' | 'mapping_coverage' | 'top_mapped' | 'learner_distribution' | 'skill_gaps' | 'recent_propagation' | 'activity_feed';
  title: string;
  visible: boolean;
  colSpan: number; // 1 to 4
  order: number;
}

const DEFAULT_SKILL_WIDGETS: SkillWidgetConfig[] = [
  { id: 'w-kpi', type: 'kpi', title: 'Skill KPI Metrics', visible: true, colSpan: 4, order: 1 },
  { id: 'w-status', type: 'status_breakdown', title: 'Skill Lifecycle Breakdown', visible: true, colSpan: 2, order: 2 },
  { id: 'w-clusters', type: 'cluster_distribution', title: 'Competency Cluster Distribution', visible: true, colSpan: 2, order: 3 },
  { id: 'w-coverage', type: 'mapping_coverage', title: 'Learning Hierarchy Mapping Coverage', visible: true, colSpan: 2, order: 4 },
  { id: 'w-top', type: 'top_mapped', title: 'Most-Mapped Competency Skills', visible: true, colSpan: 2, order: 5 },
  { id: 'w-distribution', type: 'learner_distribution', title: 'Learner Skill Distribution & Attainment', visible: true, colSpan: 2, order: 6 },
  { id: 'w-gaps', type: 'skill_gaps', title: 'Competency Gap & Unmapped Elements Analysis', visible: true, colSpan: 2, order: 7 },
  { id: 'w-propagation', type: 'recent_propagation', title: 'Centralized Propagation & Update Audit', visible: true, colSpan: 4, order: 8 }
];

@Component({
  selector: 'app-skill-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CustomSelectComponent],
  templateUrl: './skill-dashboard.component.html'
})
export class SkillDashboardComponent {
  lmsData = inject(LmsDataService);

  // Studio Mode State (§10.5)
  isStudioMode = signal<boolean>(false);

  // Widgets state
  widgets = signal<SkillWidgetConfig[]>(JSON.parse(JSON.stringify(DEFAULT_SKILL_WIDGETS)));
  draftWidgets = signal<SkillWidgetConfig[]>([]);

  // Search & filter states
  searchQuery = signal<string>('');
  isFilterPanelOpen = signal<boolean>(true);
  selectedStatus = signal<string>('all');
  selectedCategory = signal<string>('all');
  selectedCluster = signal<string>('all');
  selectedCoverage = signal<string>('all');
  sortBy = signal<string>('created_desc');

  categories: string[] = [
    'Technical', 
    'Behavioral', 
    'Leadership', 
    'Functional', 
    'Compliance', 
    'Operations', 
    'Domain Knowledge'
  ];

  statusSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Statuses', icon: 'all_inclusive' },
    { value: 'active', label: 'Active', icon: 'check_circle', badge: 'Active', badgeClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'inactive', label: 'Inactive', icon: 'pause_circle', badge: 'Inactive', badgeClass: 'bg-rose-50 text-rose-700' },
    { value: 'draft', label: 'Draft', icon: 'draft', badge: 'Draft', badgeClass: 'bg-blue-50 text-blue-700' }
  ];

  categorySelectOptions = computed<SelectOption[]>(() => {
    return [
      { value: 'all', label: 'All Categories', icon: 'category' },
      ...this.categories.map(c => ({ value: c, label: c, icon: 'psychology' }))
    ];
  });

  clusterSelectOptions = computed<SelectOption[]>(() => {
    return [
      { value: 'all', label: 'All Clusters', icon: 'bubble_chart' },
      { value: 'uncategorized', label: 'Uncategorized', icon: 'layers_clear' },
      ...this.lmsData.skillClusters().map(c => ({ value: c.clusterId, label: c.name, icon: 'bubble_chart' }))
    ];
  });

  coverageSelectOptions: SelectOption[] = [
    { value: 'all', label: 'All Depths & Levels', icon: 'account_tree' },
    { value: 'mapped', label: 'Mapped (>0 Elements)', icon: 'link' },
    { value: 'unmapped', label: 'Unmapped (0 Links)', icon: 'link_off' }
  ];

  sortBySelectOptions: SelectOption[] = [
    { value: 'created_desc', label: 'Recently Created', icon: 'schedule' },
    { value: 'name_asc', label: 'Name (A-Z)', icon: 'sort_by_alpha' },
    { value: 'name_desc', label: 'Name (Z-A)', icon: 'sort_by_alpha' },
    { value: 'most_mapped', label: 'Most Mapped', icon: 'account_tree' },
    { value: 'most_acquired', label: 'Most Acquired', icon: 'school' }
  ];

  activeFiltersCount = computed<number>(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedCategory() !== 'all') count++;
    if (this.selectedCluster() !== 'all') count++;
    if (this.selectedCoverage() !== 'all') count++;
    if (this.sortBy() !== 'created_desc') count++;
    return count;
  });

  hasActiveFilters = computed<boolean>(() => {
    return this.activeFiltersCount() > 0 || this.searchQuery().trim() !== '';
  });

  resetFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('all');
    this.selectedCategory.set('all');
    this.selectedCluster.set('all');
    this.selectedCoverage.set('all');
    this.sortBy.set('created_desc');
  }

  // Filtered skills subset for statistics
  filteredSkillsForStats = computed(() => {
    let list = this.lmsData.skills();
    const q = this.searchQuery().trim().toLowerCase();
    const status = this.selectedStatus();
    const cat = this.selectedCategory();
    const cluster = this.selectedCluster();
    const cov = this.selectedCoverage();
    const sort = this.sortBy();

    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.skillCode.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.clusterName && s.clusterName.toLowerCase().includes(q))
      );
    }

    if (status !== 'all') {
      list = list.filter(s => s.status === status);
    }

    if (cat !== 'all') {
      list = list.filter(s => s.category === cat);
    }

    if (cluster !== 'all') {
      if (cluster === 'uncategorized') {
        list = list.filter(s => !s.clusterId);
      } else {
        list = list.filter(s => s.clusterId === cluster);
      }
    }

    if (cov === 'mapped') {
      list = list.filter(s => s.mappedElementCount > 0);
    } else if (cov === 'unmapped') {
      list = list.filter(s => s.mappedElementCount === 0);
    }

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'name_desc': return b.name.localeCompare(a.name);
        case 'most_mapped': return b.mappedElementCount - a.mappedElementCount;
        case 'most_acquired': return b.learnersAcquiredCount - a.learnersAcquiredCount;
        case 'created_desc':
        default:
          return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
    });

    return list;
  });

  // Statistics Computations
  totalSkills = computed(() => this.filteredSkillsForStats().length);
  activeSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'active').length);
  inactiveSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'inactive').length);
  draftSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'draft').length);
  totalMappingsCount = computed(() => this.lmsData.skillMappings().length);

  // Global telemetry for top cards
  globalActiveSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'active').length);
  globalActiveSkillsPercentage = computed<number>(() => {
    const total = this.lmsData.skills().length;
    if (!total) return 0;
    return Math.round((this.globalActiveSkillsCount() / total) * 100);
  });
  globalUnmappedSkillsCount = computed(() => this.lmsData.skills().filter(s => s.mappedElementCount === 0).length);

  activeSkillsPercentage = computed<number>(() => {
    const total = this.totalSkills();
    if (!total) return 0;
    return Math.round((this.activeSkillsCount() / total) * 100);
  });

  inactiveSkillsPercentage = computed<number>(() => {
    const total = this.totalSkills();
    if (!total) return 0;
    return Math.round((this.inactiveSkillsCount() / total) * 100);
  });

  draftSkillsPercentage = computed<number>(() => {
    const total = this.totalSkills();
    if (!total) return 0;
    return Math.round((this.draftSkillsCount() / total) * 100);
  });
  
  clusterCount = computed(() => {
    const activeClusters = new Set(this.filteredSkillsForStats().map(s => s.clusterId).filter(id => !!id));
    return this.selectedCluster() === 'all' 
      ? this.lmsData.skillClusters().length 
      : activeClusters.size;
  });
  unmappedSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.mappedElementCount === 0).length);

  // Widget Helpers for Dynamic Visibility and Layout Classes
  isWidgetVisible(id: string): boolean {
    const list = this.isStudioMode() ? this.draftWidgets() : this.widgets();
    const w = list.find(x => x.id === id);
    return w ? w.visible : true;
  }

  getWidgetClass(id: string): string {
    const list = this.isStudioMode() ? this.draftWidgets() : this.widgets();
    const w = list.find(x => x.id === id);
    const colSpan = w ? w.colSpan : 2;
    switch (colSpan) {
      case 1: return 'md:col-span-1 p-5 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs space-y-4';
      case 2: return 'md:col-span-2 p-5 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs space-y-4';
      case 3: return 'md:col-span-3 p-5 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs space-y-4';
      case 4: return 'md:col-span-4 p-5 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs space-y-4';
      default: return 'md:col-span-2 p-5 rounded-3xl bg-white dark:bg-base-100 border border-slate-200/80 dark:border-base-300 shadow-2xs space-y-4';
    }
  }

  // Top Mapped Skills
  topMappedSkills = computed(() => {
    return [...this.filteredSkillsForStats()]
      .sort((a, b) => b.mappedElementCount - a.mappedElementCount)
      .slice(0, 5);
  });

  // Target Type Mapping Breakdown
  targetTypeBreakdown = computed(() => {
    const mappings = this.lmsData.skillMappings();
    const activeSkillIds = new Set(this.filteredSkillsForStats().map(s => s.skillId));
    const map = { plan: 0, phase: 0, course: 0, content: 0 };
    mappings.forEach(m => {
      if (!activeSkillIds.has(m.skillId)) return;
      if (m.targetType === 'plan') map.plan++;
      else if (m.targetType === 'phase') map.phase++;
      else if (m.targetType === 'course' || m.targetType === 'class') map.course++;
      else if (m.targetType === 'content') map.content++;
    });
    return map;
  });

  // Learner Skill Progress Stats
  learnerSkillsList = computed(() => {
    const activeSkillIds = new Set(this.filteredSkillsForStats().map(s => s.skillId));
    return this.lmsData.learnerSkillProgress().filter(p => activeSkillIds.has(p.skillId));
  });

  // Skill Gaps
  unacquiredSkills = computed(() => {
    const acquiredSkillIds = new Set(this.lmsData.learnerSkillProgress().filter(p => p.acquired).map(p => p.skillId));
    return this.filteredSkillsForStats().filter(s => s.status === 'active' && !acquiredSkillIds.has(s.skillId));
  });

  // Change Propagation Logs
  propagationLogs = computed(() => {
    const activeSkillIds = new Set(this.filteredSkillsForStats().map(s => s.skillId));
    return this.lmsData.skillChangeLogs().filter(l => activeSkillIds.has(l.skillId));
  });

  // Studio Mode Toggle & Controls
  enterStudioMode() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(this.widgets())));
    this.isStudioMode.set(true);
  }

  publishStudio() {
    this.widgets.set(JSON.parse(JSON.stringify(this.draftWidgets())));
    this.isStudioMode.set(false);
    this.lmsData.showToast('Dashboard Studio layouts published live.', 'success', 3000, 'Dashboard Published');
  }

  discardStudio() {
    this.isStudioMode.set(false);
  }

  resetStudioDefault() {
    this.draftWidgets.set(JSON.parse(JSON.stringify(DEFAULT_SKILL_WIDGETS)));
  }

  toggleWidgetVisibility(id: string) {
    this.draftWidgets.update(list => list.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  }

  setWidgetWidth(id: string, colSpan: number) {
    this.draftWidgets.update(list => list.map(w => w.id === id ? { ...w, colSpan } : w));
  }
}
