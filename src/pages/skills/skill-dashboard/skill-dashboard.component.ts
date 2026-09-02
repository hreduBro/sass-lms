import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';

@Component({
  selector: 'app-skill-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './skill-dashboard.component.html'
})
export class SkillDashboardComponent {
  lmsData = inject(LmsDataService);

  // Statistics Computations directly from repository
  totalSkills = computed(() => this.lmsData.skills().length);
  activeSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'active').length);
  inactiveSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'inactive').length);
  draftSkillsCount = computed(() => this.lmsData.skills().filter(s => s.status === 'draft').length);
  totalMappingsCount = computed(() => this.lmsData.skillMappings().length);

  // Global telemetry for top cards
  globalActiveSkillsCount = computed(() => this.activeSkillsCount());
  globalActiveSkillsPercentage = computed<number>(() => {
    const total = this.totalSkills();
    if (!total) return 0;
    return Math.round((this.activeSkillsCount() / total) * 100);
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
  
  clusterCount = computed(() => this.lmsData.skillClusters().length);
  unmappedSkillsCount = computed(() => this.globalUnmappedSkillsCount());

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
}
