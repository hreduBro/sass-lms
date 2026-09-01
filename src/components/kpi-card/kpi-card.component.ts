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
    edit_note: 'edit_document',
    draft: 'edit_document',
    layers: 'layers',
    hub: 'hub'
  };

  getIconBgClass(): string {
    const col = this.resolvedData().color;
    const icon = this.resolvedData().icon;

    if (col === 'emerald' || icon === 'check') {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';
    }
    if (col === 'sky' || icon === 'draft' || icon === 'edit_note') {
      return 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400';
    }
    if (col === 'teal' || icon === 'layers') {
      return 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400';
    }
    if (col === 'violet') {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400';
    }
    if (col === 'amber' || icon === 'pending') {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
    }
    if (col === 'rose' || icon === 'school') {
      return 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400';
    }
    return 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400';
  }

  getValueColorClass(): string {
    const col = this.resolvedData().color;
    if (col === 'emerald') return 'text-emerald-600 dark:text-emerald-400';
    if (col === 'sky') return 'text-sky-600 dark:text-sky-400';
    if (col === 'teal') return 'text-teal-600 dark:text-teal-400';
    if (col === 'violet') return 'text-purple-600 dark:text-purple-400';
    if (col === 'amber') return 'text-amber-600 dark:text-amber-400';
    return 'text-slate-900 dark:text-white';
  }
}

