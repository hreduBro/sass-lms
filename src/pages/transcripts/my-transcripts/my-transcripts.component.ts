import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { TranscriptRecord, TranscriptLevel } from '../../../models/transcript.model';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';

@Component({
  selector: 'app-my-transcripts',
  imports: [CommonModule, FormsModule, RouterModule, TranscriptSheetComponent, CustomAvatarComponent],
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- ========================================================================= -->
      <!-- 1. LEARNER HEADER BANNER                                                  -->
      <!-- ========================================================================= -->
      <div class="p-6 rounded-3xl bg-base-100 border border-base-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tenant-50 dark:bg-tenant-500/20 text-tenant-700 dark:text-tenant-200 border border-tenant-500/30 flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">school</span>
              Learner Credentials Portal
            </span>
            <span class="text-xs text-text-secondary">
              Academic ID: <strong class="font-mono text-text-primary">{{ lms.currentUser().id }}</strong>
            </span>
          </div>

          <h1 class="text-2xl font-bold tracking-tight text-text-primary">My Academic Transcripts</h1>
          <p class="text-xs text-text-secondary mt-0.5 max-w-2xl">
            Official records of your completed courses, training phases, and certified learning plans. Access verified grades and download official PDF transcripts.
          </p>
        </div>

        <!-- Trainee Profile Card & Quick Actions -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-3 bg-base-200/80 p-3 rounded-2xl border border-base-300 shrink-0">
            <app-custom-avatar [name]="lms.currentUser().name" [url]="lms.currentUser().avatar" size="md" shape="squircle"></app-custom-avatar>
            <div>
              <div class="font-bold text-xs text-text-primary">{{ lms.currentUser().name }}</div>
              <div class="text-[11px] text-text-secondary font-mono">{{ lms.currentUser().email }}</div>
              <span class="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Active Learner</span>
            </div>
          </div>

          @if (isAdminRole()) {
            <a 
              routerLink="/transcripts"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-base-100 hover:bg-base-200 text-text-primary border border-base-300 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Return to Administrator Transcripts Registry">
              <span class="material-symbols-outlined text-sm text-tenant-500">admin_panel_settings</span>
              <span>Registry</span>
            </a>
          }
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. LEARNER METRICS STRIP                                                  -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-text-secondary">Released Credentials</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ releasedCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Verified records</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <span class="material-symbols-outlined">verified</span>
          </div>
        </div>

        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-text-secondary">Total Credit Hours</p>
            <h3 class="text-2xl font-bold text-text-primary mt-1 font-mono">{{ totalCredits() }} hrs</h3>
            <span class="text-[11px] text-text-secondary">Accumulated training</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <span class="material-symbols-outlined">history_edu</span>
          </div>
        </div>

        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-text-secondary">Certified Plans</p>
            <h3 class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">{{ countByLevel('plan') }}</h3>
            <span class="text-[11px] text-text-secondary">Program completions</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <span class="material-symbols-outlined">workspace_premium</span>
          </div>
        </div>

        <div class="bg-base-100 border border-base-300 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-text-secondary">Awaiting Closure</p>
            <h3 class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">{{ pendingCount() }}</h3>
            <span class="text-[11px] text-text-secondary">Gated on plan sign-off</span>
          </div>
          <div class="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <span class="material-symbols-outlined">lock_clock</span>
          </div>
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. SEARCH & LEVEL TABS BAR                                                -->
      <!-- ========================================================================= -->
      <div class="bg-base-100 border border-base-300 rounded-2xl p-4 space-y-3 shadow-sm">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <!-- Search Field -->
          <div class="relative flex-1 max-w-md">
            <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary text-base pointer-events-none">search</span>
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Search by Course/Phase name, serial number..."
              class="w-full pl-9 pr-9 py-2 bg-base-200 border border-base-300 rounded-xl text-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-tenant-500 transition-colors" />
            @if (searchTerm()) {
              <button 
                type="button" 
                (click)="searchTerm.set('')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-0.5 rounded-md cursor-pointer">
                <span class="material-symbols-outlined text-xs">close</span>
              </button>
            }
          </div>

          <!-- Level Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              (click)="selectedTab.set('all')"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
              [class]="selectedTab() === 'all' 
                ? 'bg-tenant-500 text-white shadow-2xs' 
                : 'bg-base-200/80 hover:bg-base-200 text-text-secondary border border-base-300'">
              All ({{ myTranscripts().length }})
            </button>

            <button
              type="button"
              (click)="selectedTab.set('plan')"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              [class]="selectedTab() === 'plan' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'bg-base-200/80 hover:bg-base-200 text-text-secondary border border-base-300'">
              <span>Plans</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'plan' ? 'bg-white/20 text-white' : 'bg-base-300 text-text-primary'">
                {{ countByLevel('plan') }}
              </span>
            </button>

            <button
              type="button"
              (click)="selectedTab.set('phase')"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              [class]="selectedTab() === 'phase' 
                ? 'bg-blue-600 text-white shadow-2xs' 
                : 'bg-base-200/80 hover:bg-base-200 text-text-secondary border border-base-300'">
              <span>Phases</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'phase' ? 'bg-white/20 text-white' : 'bg-base-300 text-text-primary'">
                {{ countByLevel('phase') }}
              </span>
            </button>

            <button
              type="button"
              (click)="selectedTab.set('course')"
              class="px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              [class]="selectedTab() === 'course' 
                ? 'bg-emerald-600 text-white shadow-2xs' 
                : 'bg-base-200/80 hover:bg-base-200 text-text-secondary border border-base-300'">
              <span>Courses</span>
              <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'course' ? 'bg-white/20 text-white' : 'bg-base-300 text-text-primary'">
                {{ countByLevel('course') }}
              </span>
            </button>
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 4. TRANSCRIPTS GRID CARDS                                                 -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (t of filteredMyTranscripts(); track t.transcriptId) {
          
          <!-- Released Transcript Card -->
          @if (t.releaseState === 'released') {
            <div class="bg-base-100 rounded-3xl border border-base-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                
                <!-- Level & Serial Bar -->
                <div class="flex items-center justify-between">
                  <span [class]="getLevelBadgeClass(t.level)">
                    {{ t.level | uppercase }}
                  </span>
                  <span class="text-[11px] font-mono text-text-secondary font-medium">
                    {{ t.content.serialNumber }}
                  </span>
                </div>

                <!-- Scope Title -->
                <div>
                  <h3 class="text-base font-bold text-text-primary leading-snug">
                    {{ t.scopeName }}
                  </h3>
                  <p class="text-xs text-text-secondary mt-0.5">
                    Plan: <span class="text-text-primary font-medium">{{ t.planName }}</span>
                  </p>
                </div>

                <!-- Performance Summary Pill -->
                <div class="p-3 bg-base-200 rounded-2xl border border-base-300 flex items-center justify-between text-xs">
                  <div>
                    <div class="text-[10px] text-text-secondary uppercase font-semibold">Score / Result</div>
                    <div class="text-base font-bold text-text-primary font-mono">{{ t.content.result }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-[10px] text-text-secondary uppercase font-semibold">Status</div>
                    <span [class]="getStatusBadgeClass(t.content.status)">
                      {{ t.content.status | uppercase }}
                    </span>
                  </div>
                </div>

                <!-- Metadata Row -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-text-secondary pt-1">
                  <div>Completed: <span class="font-medium text-text-primary font-mono">{{ t.content.completionDate }}</span></div>
                  <div class="text-right">Credits: <span class="font-semibold text-text-primary">{{ t.content.totalCredits }} hrs</span></div>
                </div>
              </div>

              <!-- Action Footer -->
              <div class="pt-3 border-t border-base-300 flex items-center gap-2">
                <button
                  type="button"
                  (click)="viewTranscript(t)"
                  class="flex-1 py-2 bg-base-200 hover:bg-base-300 text-text-primary rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  <span>View Transcript</span>
                </button>

                @if (t.downloadEnabled) {
                  <button
                    type="button"
                    (click)="downloadPdf(t)"
                    class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                    title="Download Official CSV / Sheet">
                    <span class="material-symbols-outlined text-sm">download</span>
                    <span>CSV</span>
                  </button>
                } @else {
                  <span
                    class="px-3 py-2 bg-base-200 text-text-secondary rounded-xl text-xs flex items-center gap-1 cursor-not-allowed border border-base-300"
                    title="Download is not enabled for this transcript.">
                    <span class="material-symbols-outlined text-sm text-amber-500">lock</span>
                    <span>Locked</span>
                  </span>
                }
              </div>
            </div>
          }

          <!-- Pending / Plan-Not-Closed Locked Informative Card -->
          @if (t.releaseState === 'pending') {
            <div class="bg-amber-50/40 dark:bg-amber-950/20 rounded-3xl border border-amber-200/80 dark:border-amber-800/60 p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 uppercase">
                    Plan Level · Pending Closure
                  </span>
                  <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">lock_clock</span>
                </div>

                <div>
                  <h3 class="text-base font-bold text-text-primary leading-snug">
                    {{ t.scopeName }}
                  </h3>
                  <p class="text-xs text-text-secondary mt-0.5">
                    Plan Completed on <span class="font-semibold text-text-primary">{{ t.content.completionDate }}</span>
                  </p>
                </div>

                <!-- Plan Closed Gate Notice -->
                <div class="p-3 bg-base-100/90 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs space-y-1">
                  <div class="font-bold flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <span class="material-symbols-outlined text-sm">info</span>
                    Awaiting Plan Administrative Closure
                  </div>
                  <p class="text-[11px] text-text-secondary leading-relaxed">
                    Your Plan transcript will be available after the Plan is completed and closed by the academic directorate.
                  </p>
                </div>
              </div>

              <div class="pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs text-text-secondary">
                <span class="font-mono text-[11px]">Score: {{ t.content.result }}</span>
                <span class="text-amber-700 dark:text-amber-400 font-semibold text-[11px]">Gated on Plan Closure</span>
              </div>
            </div>
          }

        }
      </div>

      <!-- Empty State -->
      @if (filteredMyTranscripts().length === 0) {
        <div class="bg-base-100 rounded-3xl border border-base-300 p-12 text-center space-y-3">
          <span class="material-symbols-outlined text-5xl text-text-secondary/40">school</span>
          <h3 class="text-base font-bold text-text-primary">No transcripts released yet</h3>
          <p class="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
            As you complete your assigned courses, training phases, and closed plans, your official academic transcripts will automatically appear here for viewing and verification.
          </p>
          <div class="pt-2">
            <a
              routerLink="/courses/dashboard"
              class="inline-flex items-center gap-1.5 px-4 py-2 bg-tenant-500 hover:bg-tenant-600 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-sm">menu_book</span>
              <span>Go to Courses</span>
            </a>
          </div>
        </div>
      }

      <!-- Official Transcript Document Modal -->
      @if (activeTranscript()) {
        <app-transcript-sheet
          [transcript]="activeTranscript()!"
          [isAdmin]="false"
          (close)="activeTranscript.set(null)"
          (download)="downloadPdf($event)"
        />
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyTranscriptsComponent {
  lms = inject(LmsDataService);

  searchTerm = signal<string>('');
  selectedTab = signal<'all' | 'course' | 'phase' | 'plan'>('all');
  activeTranscript = signal<TranscriptRecord | null>(null);

  isAdminRole = computed(() => {
    const role = this.lms.activeRole();
    return ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'].includes(role);
  });

  // All transcripts associated with this learner (or all for demo/admin preview)
  myTranscripts = computed(() => {
    const user = this.lms.currentUser();
    const role = this.lms.activeRole();
    if (role === 'learner') {
      return this.lms.transcripts().filter(t => t.traineeId === user.id || t.traineeEmail === user.email);
    }
    return this.lms.transcripts();
  });

  filteredMyTranscripts = computed(() => {
    let list = this.myTranscripts();
    const tab = this.selectedTab();
    if (tab !== 'all') {
      list = list.filter(t => t.level === tab);
    }
    const q = this.searchTerm().toLowerCase().trim();
    if (q) {
      list = list.filter(t => 
        t.scopeName.toLowerCase().includes(q) ||
        t.planName.toLowerCase().includes(q) ||
        t.content.serialNumber.toLowerCase().includes(q)
      );
    }
    return list;
  });

  releasedCount = computed(() => this.myTranscripts().filter(t => t.releaseState === 'released').length);
  pendingCount = computed(() => this.myTranscripts().filter(t => t.releaseState === 'pending').length);
  totalCredits = computed(() => this.myTranscripts().reduce((sum, t) => sum + (t.content.totalCredits || 0), 0));

  countByLevel(level: TranscriptLevel): number {
    return this.myTranscripts().filter(t => t.level === level).length;
  }

  viewTranscript(t: TranscriptRecord): void {
    this.activeTranscript.set(t);
  }

  downloadPdf(t: TranscriptRecord): void {
    const csv = this.lms.generateTranscriptCsv([t]);
    this.lms.downloadCsv(csv, `My_Official_Transcript_${t.content.serialNumber}.csv`);
  }

  getLevelBadgeClass(level: TranscriptLevel): string {
    switch (level) {
      case 'plan':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'phase':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'course':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-base-200 text-text-secondary border border-base-300';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pass':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'fail':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'completed':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-base-200 text-text-secondary border border-base-300';
    }
  }
}

