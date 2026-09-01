import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;
export type AvatarShape = 'squircle' | 'rounded' | 'circle' | 'square';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | null;
export type AvatarVariant = 'auto' | 'tenant' | 'neutral' | 'subtle' | 'gradient';

interface ColorPair {
  bg: string;
  text: string;
  border: string;
  glow?: string;
}

const PALETTES: ColorPair[] = [
  {
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200/80 dark:border-emerald-800/60'
  },
  {
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200/80 dark:border-indigo-800/60'
  },
  {
    bg: 'bg-sky-50 dark:bg-sky-950/60',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200/80 dark:border-sky-800/60'
  },
  {
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200/80 dark:border-purple-800/60'
  },
  {
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-200/80 dark:border-amber-800/60'
  },
  {
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200/80 dark:border-rose-800/60'
  },
  {
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-200/80 dark:border-teal-800/60'
  },
  {
    bg: 'bg-violet-50 dark:bg-violet-950/60',
    text: 'text-violet-700 dark:text-violet-300',
    border: 'border-violet-200/80 dark:border-violet-800/60'
  },
  {
    bg: 'bg-tenant-50 dark:bg-tenant-950/60',
    text: 'text-tenant-700 dark:text-tenant-300',
    border: 'border-tenant-200/80 dark:border-tenant-800/60'
  }
];

@Component({
  selector: 'app-custom-avatar',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'inline-flex shrink-0 select-none align-middle'
  },
  template: `
    <div 
      class="relative inline-flex items-center justify-center shrink-0 overflow-hidden font-semibold transition-all duration-200"
      [ngClass]="[
        containerSizeClass(),
        shapeClass(),
        colorClasses(),
        interactive() ? 'hover:scale-105 hover:shadow-xs cursor-pointer' : '',
        customClass()
      ]"
      [attr.title]="titleText()">
      
      <!-- If Image is provided and has not errored -->
      @if (effectiveImageUrl() && !imageFailed()) {
        <img 
          [src]="effectiveImageUrl()" 
          [alt]="alt() || name() || 'Avatar'"
          (error)="handleImageError()"
          referrerpolicy="no-referrer"
          class="w-full h-full object-cover shrink-0 pointer-events-none"
          [ngClass]="shapeClass()" />
      } @else if (icon()) {
        <!-- Icon fallback -->
        <span class="material-symbols-outlined leading-none shrink-0" [ngClass]="iconSizeClass()">
          {{ icon() }}
        </span>
      } @else {
        <!-- Initials fallback with refined typography -->
        <span class="font-bold tracking-tight uppercase leading-none select-none text-center flex items-center justify-center" [ngClass]="textSizeClass()">
          {{ computedInitials() }}
        </span>
      }

      <!-- Status Indicator Badge -->
      @if (status()) {
        <span 
          class="absolute rounded-full border-2 border-base-100 dark:border-slate-900 shadow-2xs z-10"
          [ngClass]="[
            statusDotSizeClass(),
            statusPositionClass(),
            statusColorClass()
          ]">
        </span>
      }
    </div>
  `
})
export class CustomAvatarComponent {
  name = input<string>('');
  imageUrl = input<string | null | undefined>('');
  url = input<string | null | undefined>('');
  size = input<AvatarSize>('md');
  shape = input<AvatarShape>('squircle');
  status = input<AvatarStatus>(null);
  statusPosition = input<'bottom-right' | 'top-right'>('bottom-right');
  variant = input<AvatarVariant>('auto');
  initialsCount = input<number | 'auto'>('auto');
  icon = input<string>('');
  alt = input<string>('');
  customClass = input<string>('');
  interactive = input<boolean>(false);
  showTooltip = input<boolean>(true);

  imageFailed = signal<boolean>(false);

  effectiveImageUrl = computed(() => {
    return this.imageUrl() || this.url() || '';
  });

  handleImageError() {
    this.imageFailed.set(true);
  }

  titleText = computed(() => {
    if (!this.showTooltip()) return null;
    return this.name() || this.alt() || null;
  });

  computedInitials = computed(() => {
    const rawName = (this.name() || this.alt() || '').trim();
    if (!rawName) return '?';

    // Remove salutations like Dr., Prof., Mr., Ms., MD, PhD, etc.
    const cleaned = rawName
      .replace(/^(Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.|Eng\.)\s+/i, '')
      .replace(/,\s*(MD|PhD|CISSP|CAMS|MBA|BSc|MSc)$/i, '')
      .trim();

    const parts = cleaned.split(/\s+/).filter(Boolean);
    const count = this.initialsCount();

    if (count === 1) {
      return (parts[0]?.[0] || rawName[0] || '?').toUpperCase();
    }

    if (count === 2) {
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return (parts[0]?.slice(0, 2) || rawName.slice(0, 2) || '?').toUpperCase();
    }

    // Auto behavior: single initial for xs/sm, two initials for md/lg/xl/2xl
    const sz = this.size();
    if (sz === 'xs' || sz === 'sm') {
      return (parts[0]?.[0] || rawName[0] || '?').toUpperCase();
    }

    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (parts[0]?.[0] || rawName[0] || '?').toUpperCase();
  });

  containerSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'w-5 h-5 min-w-[20px] min-h-[20px]';
      case 'sm':
        return 'w-6 h-6 min-w-[24px] min-h-[24px]';
      case 'md':
        return 'w-8 h-8 min-w-[32px] min-h-[32px]';
      case 'lg':
        return 'w-10 h-10 min-w-[40px] min-h-[40px]';
      case 'xl':
        return 'w-12 h-12 min-w-[48px] min-h-[48px]';
      case '2xl':
        return 'w-16 h-16 min-w-[64px] min-h-[64px]';
      case '3xl':
        return 'w-20 h-20 min-w-[80px] min-h-[80px]';
      default:
        // Allow passing custom sizing class like 'w-7 h-7'
        if (typeof this.size() === 'string' && this.size().includes('w-')) {
          return this.size();
        }
        return 'w-8 h-8 min-w-[32px] min-h-[32px]';
    }
  });

  shapeClass = computed(() => {
    switch (this.shape()) {
      case 'square':
        return 'rounded-sm';
      case 'circle':
        return 'rounded-full';
      case 'squircle':
      case 'rounded':
      default:
        // Smooth squircle shape (superellipse) matching the user reference image
        switch (this.size()) {
          case 'xs':
            return 'rounded-[30%]';
          case 'sm':
            return 'rounded-[30%]';
          case 'md':
            return 'rounded-[30%]';
          case 'lg':
            return 'rounded-[30%]';
          case 'xl':
            return 'rounded-[30%]';
          case '2xl':
            return 'rounded-[30%]';
          case '3xl':
            return 'rounded-[30%]';
          default:
            return 'rounded-[30%]';
        }
    }
  });

  textSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'text-[9px]';
      case 'sm':
        return 'text-[10px]';
      case 'md':
        return 'text-[11px]';
      case 'lg':
        return 'text-xs';
      case 'xl':
        return 'text-sm font-extrabold';
      case '2xl':
        return 'text-lg font-extrabold';
      case '3xl':
        return 'text-2xl font-extrabold';
      default:
        return 'text-xs';
    }
  });

  iconSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs':
        return 'text-[12px]';
      case 'sm':
        return 'text-[14px]';
      case 'md':
        return 'text-[18px]';
      case 'lg':
        return 'text-[22px]';
      case 'xl':
        return 'text-[26px]';
      case '2xl':
        return 'text-[34px]';
      default:
        return 'text-base';
    }
  });

  statusDotSizeClass = computed(() => {
    switch (this.size()) {
      case 'xs':
      case 'sm':
        return 'w-1.5 h-1.5';
      case 'md':
        return 'w-2.5 h-2.5';
      case 'lg':
        return 'w-3 h-3';
      case 'xl':
      case '2xl':
      case '3xl':
        return 'w-3.5 h-3.5';
      default:
        return 'w-2 h-2';
    }
  });

  statusPositionClass = computed(() => {
    if (this.statusPosition() === 'top-right') {
      return '-top-0.5 -right-0.5';
    }
    return '-bottom-0.5 -right-0.5';
  });

  statusColorClass = computed(() => {
    switch (this.status()) {
      case 'online':
        return 'bg-emerald-500 animate-pulse';
      case 'busy':
        return 'bg-rose-500';
      case 'away':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-slate-400 dark:bg-slate-600';
      default:
        return 'bg-emerald-500';
    }
  });

  colorClasses = computed(() => {
    // If image is present and not failed, only border is needed
    if (this.imageUrl() && !this.imageFailed()) {
      return 'border border-base-300/80 dark:border-slate-700 bg-base-200 dark:bg-slate-800 shadow-2xs';
    }

    if (this.variant() === 'tenant') {
      return 'bg-tenant-50 dark:bg-tenant-950/60 text-tenant-700 dark:text-tenant-300 border border-tenant-200/80 dark:border-tenant-800/60 shadow-2xs';
    }

    if (this.variant() === 'neutral') {
      return 'bg-base-200 dark:bg-slate-800 text-text-primary border border-base-300 dark:border-slate-700 shadow-2xs';
    }

    if (this.variant() === 'subtle') {
      return 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs';
    }

    if (this.variant() === 'gradient') {
      return 'bg-gradient-to-tr from-tenant-500 to-indigo-500 text-white border border-white/20 shadow-2xs';
    }

    // Auto variant: deterministic hash-based palette
    const str = this.name() || this.alt() || 'User';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PALETTES.length;
    const pair = PALETTES[index];

    return `${pair.bg} ${pair.text} border ${pair.border} shadow-2xs`;
  });
}
