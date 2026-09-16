import { Component, computed, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';

@Component({
  selector: 'app-offline-training-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './offline-training-dashboard.component.html'
})
export class OfflineTrainingDashboardComponent {
  lmsData = inject(LmsDataService);

  totalTrainings = computed(() => this.lmsData.offlineTrainings().length);
  publishedTrainings = computed(() => this.lmsData.offlineTrainings().filter(t => t.status === 'published').length);
  totalEmbeddings = computed(() => this.lmsData.offlineTrainingEmbeddings().length);
  totalResults = computed(() => this.lmsData.offlineTraineeResults().length);
  passedResults = computed(() => this.lmsData.offlineTraineeResults().filter(r => r.passStatus === 'passed').length);

  passRate = computed(() => {
    const total = this.totalResults();
    if (total === 0) return 0;
    return Math.round((this.passedResults() / total) * 100);
  });

  assessmentBreakdown = computed(() => {
    const map = new Map<string, number>();
    this.lmsData.offlineTrainings().forEach(t => {
      const mode = t.assessmentMode || 'none';
      map.set(mode, (map.get(mode) || 0) + 1);
    });
    return Array.from(map.entries()).map(([mode, count]) => ({ mode, count }));
  });
}
