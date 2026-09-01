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

  // Selected filter states
  selectedCategory = signal<string>('all');
  selectedCluster = signal<string>('all');

  categories: string[] = [
    'Technical', 
    'Behavioral', 
    'Leadership', 
    'Functional', 
    'Compliance', 
    'Operations', 
    'Domain Knowledge'
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

  // Filtered skills subset for statistics
  filteredSkillsForStats = computed(() => {
    let list = this.lmsData.skills();
    const cat = this.selectedCategory();
    const cluster = this.selectedCluster();

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
    return list;
  });

  // Statistics Computations
  totalSkills = computed(() => this.filteredSkillsForStats().length);
  activeSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'active').length);
  inactiveSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'inactive').length);
  draftSkillsCount = computed(() => this.filteredSkillsForStats().filter(s => s.status === 'draft').length);
  
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
