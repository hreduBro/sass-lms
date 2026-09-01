import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { Skill, SkillCluster, SkillMapping, LearnerSkillProgress, SkillChangeLog } from '../../../models/skill-mapping.model';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './skill-dashboard.component.html'
})
export class SkillDashboardComponent {
  lmsData = inject(LmsDataService);

  // Studio Mode State (§10.5)
  isStudioMode = signal<boolean>(false);

  // Widgets state
  widgets = signal<SkillWidgetConfig[]>(JSON.parse(JSON.stringify(DEFAULT_SKILL_WIDGETS)));
  draftWidgets = signal<SkillWidgetConfig[]>([]);

  // Statistics Computations
  totalSkills = computed(() => this.lmsData.skills().length);
  activeSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'active').length);
  inactiveSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'inactive').length);
  draftSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'draft').length);
  
  clusterCount = computed(() => this.lmsData.skillClusters().length);
  unmappedSkillsCount = computed(() => this.lmsData.skills().filter(s => s.mappedElementCount === 0).length);

  // Top Mapped Skills
  topMappedSkills = computed(() => {
    return [...this.lmsData.skills()]
      .sort((a, b) => b.mappedElementCount - a.mappedElementCount)
      .slice(0, 5);
  });

  // Target Type Mapping Breakdown
  targetTypeBreakdown = computed(() => {
    const mappings = this.lmsData.skillMappings();
    const map = { plan: 0, phase: 0, course: 0, content: 0 };
    mappings.forEach(m => {
      if (m.targetType === 'plan') map.plan++;
      else if (m.targetType === 'phase') map.phase++;
      else if (m.targetType === 'course' || m.targetType === 'class') map.course++;
      else if (m.targetType === 'content') map.content++;
    });
    return map;
  });

  // Learner Skill Progress Stats
  learnerSkillsList = computed(() => this.lmsData.learnerSkillProgress());

  // Skill Gaps
  unacquiredSkills = computed(() => {
    const acquiredSkillIds = new Set(this.lmsData.learnerSkillProgress().filter(p => p.acquired).map(p => p.skillId));
    return this.lmsData.skills().filter(s => s.status === 'active' && !acquiredSkillIds.has(s.skillId));
  });

  // Change Propagation Logs
  propagationLogs = computed(() => this.lmsData.skillChangeLogs());

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
