export interface Kpi {
  title: string;
  value: string;
  change: string;
  icon: 'users' | 'activity' | 'message' | 'server' | 'dollar' | 'zap' | 'school' | 'badge' | 'building' | 'shield' | 'check' | 'trending' | 'pending' | 'draft' | 'edit_note' | 'layers' | 'hub' | string;
  color: 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet' | 'teal';
  subtext?: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  action: string;
  color: string;
}
