import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Kpi } from '../../models/dashboard.model';

@Component({
  selector: 'app-kpi-card',
  imports: [CommonModule],
  templateUrl: './kpi-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  dataInput = input<Kpi | undefined>(undefined, { alias: 'data' });
  kpiInput = input<Kpi | undefined>(undefined, { alias: 'kpi' });

  resolvedData = computed<Kpi>(() => {
    return this.dataInput() || this.kpiInput() || {
      title: 'Metric',
      value: '0',
      change: '+0%',
      icon: 'activity',
      color: 'indigo'
    };
  });

  isPositiveChange = computed(() => this.resolvedData().change?.startsWith('+') ?? true);

  iconMap: Record<string, string> = {
    users: 'group',
    activity: 'trending_up',
    message: 'forum',
    server: 'dns',
    dollar: 'payments',
    zap: 'bolt',
    school: 'school',
    badge: 'military_tech',
    building: 'corporate_fare',
    shield: 'verified_user',
    check: 'task_alt',
    trending: 'trending_up',
    pending: 'hourglass_top',
    edit_note: 'edit_note',
    draft: 'edit_note',
    layers: 'layers',
    hub: 'hub'
  };
}

