import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { TranscriptRecord, TranscriptLevel } from '../../../models/transcript.model';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { KpiCardComponent } from '../../../components/kpi-card/kpi-card.component';
import { Kpi } from '../../../models/dashboard.model';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { FilterSectionComponent } from '../../../components/data-grid/filter-section.component';

@Component({
  selector: 'app-my-transcripts',
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule, 
    TranscriptSheetComponent, 
    CustomAvatarComponent,
    CustomSelectComponent,
    KpiCardComponent,
    DataGridComponent,
    FilterSectionComponent
  ],
  template: `
    <div class="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto pb-24">
      
      <!-- ========================================================================= -->
      <!-- 1. LEARNER HEADER BANNER (REDESIGNED WITH MODERN PROFILE CARD)            -->
      <!-- ========================================================================= -->
      <div class="bg-white dark:bg-base-100 rounded-3xl border border-slate-200/80 dark:border-base-300 p-6 sm:p-7 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <!-- Ambient Background Accent -->
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-tenant-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="space-y-1.5 relative z-10">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <span class="px-3 py-1 rounded-full text-[11px] font-bold bg-tenant-50 dark:bg-tenant-950/60 text-tenant-700 dark:text-tenant-300 border border-tenant-200 dark:border-tenant-800/80 flex items-center gap-1.5 shadow-2xs uppercase tracking-wide">
              <span class="material-symbols-outlined text-sm text-tenant-600 dark:text-tenant-400">school</span>
              Learner Credentials Portal
            </span>
            <span class="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-base-200 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-base-300">
              Academic ID: <strong class="font-bold text-slate-800 dark:text-slate-200">{{ lms.currentUser().id }}</strong>
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            My Academic Transcripts
          </h1>
          <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-normal">
            Official records of your completed courses, training phases, and certified learning plans. Access verified grades and download official PDF transcripts.
          </p>
        </div>

        <!-- Trainee Profile Card & Quick Actions (Redesigned per Image 2) -->
        <div class="flex items-center gap-3 relative z-10 shrink-0 flex-wrap sm:flex-nowrap">
          <div class="flex items-center gap-3 bg-slate-50/90 dark:bg-base-200/80 p-3 rounded-2xl border border-slate-200/80 dark:border-base-300 shadow-2xs hover:border-slate-300 transition-all">
            <div class="relative">
              <app-custom-avatar [name]="lms.currentUser().name" [url]="lms.currentUser().avatar" size="md" shape="squircle"></app-custom-avatar>
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-base-100 absolute -bottom-0.5 -right-0.5"></span>
            </div>
            <div class="space-y-0.5">
              <div class="font-black text-xs text-slate-900 dark:text-white tracking-tight">{{ lms.currentUser().name }}</div>
              <div class="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{{ lms.currentUser().email }}</div>
              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[9px] font-extrabold tracking-wider uppercase border border-emerald-200 dark:border-emerald-800">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ACTIVE LEARNER
              </div>
            </div>
          </div>

          @if (isAdminRole()) {
            <a 
              routerLink="/transcripts"
              class="px-4 py-3 rounded-2xl text-xs font-bold bg-white dark:bg-base-200 hover:bg-slate-50 dark:hover:bg-base-300 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-base-300 flex items-center gap-2 transition-all shadow-2xs hover:border-tenant-500/50 cursor-pointer"
              title="Return to Administrator Transcripts Registry">
              <div class="w-7 h-7 rounded-xl bg-tenant-50 dark:bg-tenant-950/60 text-tenant-600 dark:text-tenant-400 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-base">admin_panel_settings</span>
              </div>
              <span>Registry</span>
            </a>
          }
        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. LMS DASHBOARD TELEMETRY & KPI METRIC CARDS                             -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <app-kpi-card [kpi]="kpiReleasedCredentials()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiTotalCreditHours()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiCertifiedPlans()"></app-kpi-card>
        <app-kpi-card [kpi]="kpiAwaitingClosure()"></app-kpi-card>
      </div>

      <!-- ========================================================================= -->
      <!-- 3. REUSABLE DATA GRID & FILTERING                                         -->
      <!-- ========================================================================= -->
      <app-data-grid
        [searchQuery]="searchTerm()"
        (searchChange)="onSearchChange($event)"
        searchPlaceholder="Search by Course/Phase name, serial number..."
        [isFilterOpen]="isFilterPanelOpen()"
        (filterToggle)="isFilterPanelOpen.set($event)"
        [activeFilterCount]="activeFilterCount()"
        [hasActiveFilters]="activeFilterCount() > 0 || searchTerm().length > 0"
        [showReset]="activeFilterCount() > 0 || searchTerm().length > 0"
        (resetGrid)="clearAllFilters()"
        (clearFilters)="clearDraftFilters()"
        (cancelFilters)="cancelFilterPanel()"
        (applyFilters)="applyFilterPanel()"
        viewMode="grid"
        [showViewSwitcher]="false"
        [itemCountText]="'Showing ' + filteredMyTranscripts().length + ' of ' + myTranscripts().length + ' records'"
        filterPanelTitle="REFINE TRANSCRIPT CRITERIA"
        filterPanelSubtitle="Filter transcripts across assessment status, level, release state, and sorting"
        [currentPage]="currentPage()"
        (pageChange)="currentPage.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event)"
        [totalItems]="filteredMyTranscripts().length"
        [emptyStateType]="emptyStateType()"
        emptyStateIcon="school"
        emptyStateTitle="No academic transcripts found"
        emptyStateMessage="As you complete your assigned courses, training phases, and closed plans, your official academic transcripts will automatically appear here."
        emptyActionLabel="Reset Filters"
        (emptyActionClick)="clearAllFilters()"
      >
        <!-- Filter Panel Projection -->
        <div filter-panel class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Status Custom Select -->
            <app-filter-section title="1. Assessment Status">
              <app-custom-select
                [options]="statusOptions"
                [clearable]="false"
                [ngModel]="draftStatus()"
                (ngModelChange)="draftStatus.set($event)">
              </app-custom-select>
            </app-filter-section>

            <!-- Level Custom Select -->
            <app-filter-section title="2. Transcript Level">
              <app-custom-select
                [options]="levelOptions"
                [clearable]="false"
                [ngModel]="draftLevel()"
                (ngModelChange)="draftLevel.set($event)">
              </app-custom-select>
            </app-filter-section>

            <!-- Release State Custom Select -->
            <app-filter-section title="3. Release State">
              <app-custom-select
                [options]="releaseStateOptions"
                [clearable]="false"
                [ngModel]="draftReleaseState()"
                (ngModelChange)="draftReleaseState.set($event)">
              </app-custom-select>
            </app-filter-section>

            <!-- Sort Custom Select -->
            <app-filter-section title="4. Sort Order">
              <app-custom-select
                [options]="sortByOptions"
                [clearable]="false"
                [ngModel]="draftSort()"
                (ngModelChange)="draftSort.set($event)">
              </app-custom-select>
            </app-filter-section>
          </div>
        </div>

        <!-- Fast Tabs Toolbar Right Projection -->
        <div toolbar-right class="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-50 dark:bg-base-200/50 rounded-2xl border border-slate-200/80 dark:border-base-300">
          <button
            type="button"
            (click)="selectTab('all')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            [class]="selectedTab() === 'all' 
              ? 'bg-tenant-500 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
            All ({{ myTranscripts().length }})
          </button>

          <button
            type="button"
            (click)="selectTab('plan')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            [class]="selectedTab() === 'plan' 
              ? 'bg-tenant-500 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
            <span>Plans</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class]="selectedTab() === 'plan' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-base-300 text-slate-700 dark:text-slate-300'">
              {{ countByLevel('plan') }}
            </span>
          </button>

          <button
            type="button"
            (click)="selectTab('phase')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            [class]="selectedTab() === 'phase' 
              ? 'bg-tenant-500 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
            <span>Phases</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class]="selectedTab() === 'phase' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-base-300 text-slate-700 dark:text-slate-300'">
              {{ countByLevel('phase') }}
            </span>
          </button>

          <button
            type="button"
            (click)="selectTab('course')"
            class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            [class]="selectedTab() === 'course' 
              ? 'bg-tenant-500 text-white shadow-xs' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'">
            <span>Courses</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded-full" [class]="selectedTab() === 'course' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-base-300 text-slate-700 dark:text-slate-300'">
              {{ countByLevel('course') }}
            </span>
          </button>
        </div>

        <!-- Grid View Projection -->
        <div grid-view class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (t of paginatedMyTranscripts(); track t.transcriptId) {
            
            <!-- Released Transcript Card -->
            @if (t.releaseState === 'released') {
              <div class="bg-white dark:bg-base-100 rounded-3xl border border-slate-200/80 dark:border-base-300 shadow-2xs hover:shadow-md hover:border-tenant-500/30 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4">
                <div class="space-y-3.5">
                  
                  <!-- Level & Serial Bar -->
                  <div class="flex items-center justify-between">
                    <span [class]="getLevelBadgeClass(t.level)">
                      {{ t.level | uppercase }}
                    </span>
                    <span class="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-base-200 px-2 py-0.5 rounded-lg">
                      {{ t.content.serialNumber }}
                    </span>
                  </div>

                  <!-- Scope Title -->
                  <div class="space-y-1">
                    <h3 class="text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {{ t.scopeName }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Plan: <span class="text-slate-700 dark:text-slate-300 font-semibold">{{ t.planName }}</span>
                    </p>
                  </div>

                  <!-- Performance Summary Box -->
                  <div class="p-3.5 bg-slate-50 dark:bg-base-200/50 rounded-2xl border border-slate-200/80 dark:border-base-300 flex items-center justify-between text-xs">
                    <div>
                      <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score / Result</div>
                      <div class="text-base font-black text-slate-900 dark:text-white font-mono mt-0.5">{{ t.content.result }}</div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Status</div>
                      <span [class]="getStatusBadgeClass(t.content.status)" class="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span class="w-1.5 h-1.5 rounded-full shrink-0" [ngClass]="{
                          'bg-emerald-500': t.content.status === 'pass',
                          'bg-rose-500': t.content.status === 'fail',
                          'bg-blue-500': t.content.status === 'completed',
                          'bg-slate-400': t.content.status !== 'pass' && t.content.status !== 'fail' && t.content.status !== 'completed'
                        }"></span>
                        <span>{{ t.content.status | uppercase }}</span>
                      </span>
                    </div>
                  </div>

                  <!-- Metadata Row -->
                  <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                    <div class="flex items-center gap-1.5">
                      <span class="material-symbols-outlined text-xs text-slate-400">calendar_today</span>
                      <span>Completed: <strong class="font-mono font-bold text-slate-700 dark:text-slate-300">{{ t.content.completionDate }}</strong></span>
                    </div>
                    <div class="text-right flex items-center justify-end gap-1.5">
                      <span class="material-symbols-outlined text-xs text-slate-400">schedule</span>
                      <span>Credits: <strong class="font-bold text-slate-700 dark:text-slate-300">{{ t.content.totalCredits }} hrs</strong></span>
                    </div>
                  </div>
                </div>

                <!-- Action Footer -->
                <div class="pt-3 border-t border-slate-100 dark:border-base-300 flex items-center gap-2">
                  <button
                    type="button"
                    (click)="viewTranscript(t)"
                    class="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-base-200 dark:hover:bg-base-300 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                    <span>View Transcript</span>
                  </button>

                  @if (t.downloadEnabled) {
                    <button
                      type="button"
                      (click)="downloadPdf(t)"
                      class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                      title="Download Official CSV / Sheet">
                      <span class="material-symbols-outlined text-sm">download</span>
                      <span>CSV</span>
                    </button>
                  } @else {
                    <span
                      class="px-3.5 py-2.5 bg-slate-100 dark:bg-base-200 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-1 cursor-not-allowed border border-slate-200 dark:border-base-300"
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
              <div class="bg-amber-50/40 dark:bg-amber-950/20 rounded-3xl border border-amber-200/80 dark:border-amber-800/60 p-5 sm:p-6 flex flex-col justify-between space-y-4 relative overflow-hidden shadow-2xs">
                <div class="space-y-3.5">
                  <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 uppercase tracking-wider">
                      Plan Level · Pending Closure
                    </span>
                    <span class="material-symbols-outlined text-amber-600 dark:text-amber-400 text-base">lock_clock</span>
                  </div>

                  <div class="space-y-1">
                    <h3 class="text-base font-black text-slate-900 dark:text-white leading-snug">
                      {{ t.scopeName }}
                    </h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Plan Completed on <span class="font-bold text-slate-700 dark:text-slate-300">{{ t.content.completionDate }}</span>
                    </p>
                  </div>

                  <!-- Plan Closed Gate Notice -->
                  <div class="p-3.5 bg-white/90 dark:bg-base-100/90 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs space-y-1 shadow-2xs">
                    <div class="font-bold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <span class="material-symbols-outlined text-sm">info</span>
                      <span>Awaiting Plan Administrative Closure</span>
                    </div>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Your Plan transcript will be available after the Plan is completed and closed by the academic directorate.
                    </p>
                  </div>
                </div>

                <div class="pt-3 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span class="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">Score: {{ t.content.result }}</span>
                  <span class="text-amber-700 dark:text-amber-400 font-bold text-[11px]">Gated on Plan Closure</span>
                </div>
              </div>
            }

          }
        </div>
      </app-data-grid>

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

  // Filters State (Applied)
  searchTerm = signal<string>('');
  selectedTab = signal<'all' | 'course' | 'phase' | 'plan'>('all');
  selectedStatus = signal<string>('all');
  selectedLevel = signal<string>('all');
  selectedReleaseState = signal<string>('all');
  selectedSort = signal<string>('newest');

  // Draft Filters State (Inside Filter Panel before Apply Filter is clicked)
  draftStatus = signal<string>('all');
  draftLevel = signal<string>('all');
  draftReleaseState = signal<string>('all');
  draftSort = signal<string>('newest');

  isFilterPanelOpen = signal<boolean>(false);
  activeTranscript = signal<TranscriptRecord | null>(null);

  // Custom Select Dropdown Options
  statusOptions: SelectOption[] = [
    { value: 'all', label: 'Status: All', icon: 'filter_list' },
    { value: 'pass', label: 'Passed', icon: 'check_circle', badge: 'PASS', badgeClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'fail', label: 'Failed', icon: 'cancel', badge: 'FAIL', badgeClass: 'bg-rose-50 text-rose-700' },
    { value: 'completed', label: 'Completed', icon: 'task_alt', badge: 'COMPLETED', badgeClass: 'bg-blue-50 text-blue-700' }
  ];

  levelOptions: SelectOption[] = [
    { value: 'all', label: 'Level: All', icon: 'layers' },
    { value: 'plan', label: 'Certified Plans', icon: 'workspace_premium', badge: 'PLAN', badgeClass: 'bg-purple-50 text-purple-700' },
    { value: 'phase', label: 'Curriculum Phases', icon: 'auto_stories', badge: 'PHASE', badgeClass: 'bg-blue-50 text-blue-700' },
    { value: 'course', label: 'Course Modules', icon: 'menu_book', badge: 'COURSE', badgeClass: 'bg-emerald-50 text-emerald-700' }
  ];

  releaseStateOptions: SelectOption[] = [
    { value: 'all', label: 'Release State: All', icon: 'tune' },
    { value: 'released', label: 'Released (Verified)', icon: 'verified', badge: 'LIVE', badgeClass: 'bg-emerald-50 text-emerald-700' },
    { value: 'pending', label: 'Pending Plan Closure', icon: 'lock_clock', badge: 'LOCKED', badgeClass: 'bg-amber-50 text-amber-700' }
  ];

  sortByOptions: SelectOption[] = [
    { value: 'newest', label: 'Sort: Newest Completion', icon: 'calendar_today' },
    { value: 'oldest', label: 'Sort: Oldest Completion', icon: 'history' },
    { value: 'score_desc', label: 'Sort: Highest Score', icon: 'trending_up' },
    { value: 'credits_desc', label: 'Sort: Most Credits', icon: 'schedule' }
  ];

  isAdminRole = computed(() => {
    const role = this.lms.activeRole();
    return ['system_admin', 'super_admin', 'tenant_admin', 'lms_admin', 'instructor'].includes(role);
  });

  // Active filter count
  activeFilterCount = computed(() => {
    let count = 0;
    if (this.selectedStatus() !== 'all') count++;
    if (this.selectedLevel() !== 'all') count++;
    if (this.selectedReleaseState() !== 'all') count++;
    if (this.selectedSort() !== 'newest') count++;
    return count;
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

    // Level filtering (synced between tabs and dropdown)
    const level = this.selectedLevel() !== 'all' ? this.selectedLevel() : this.selectedTab();
    if (level !== 'all') {
      list = list.filter(t => t.level === level);
    }

    // Status filtering
    const status = this.selectedStatus();
    if (status !== 'all') {
      list = list.filter(t => t.content.status.toLowerCase() === status.toLowerCase());
    }

    // Release state filtering
    const release = this.selectedReleaseState();
    if (release !== 'all') {
      list = list.filter(t => t.releaseState === release);
    }

    // Search query
    const q = this.searchTerm().toLowerCase().trim();
    if (q) {
      list = list.filter(t => 
        t.scopeName.toLowerCase().includes(q) ||
        t.planName.toLowerCase().includes(q) ||
        t.content.serialNumber.toLowerCase().includes(q)
      );
    }

    // Sorting
    const sort = this.selectedSort();
    return [...list].sort((a, b) => {
      if (sort === 'oldest') {
        return (a.content.completionDate || '').localeCompare(b.content.completionDate || '');
      }
      if (sort === 'score_desc') {
        const scoreA = parseFloat(a.content.result) || 0;
        const scoreB = parseFloat(b.content.result) || 0;
        return scoreB - scoreA;
      }
      if (sort === 'credits_desc') {
        return (b.content.totalCredits || 0) - (a.content.totalCredits || 0);
      }
      // default: newest
      return (b.content.completionDate || '').localeCompare(a.content.completionDate || '');
    });
  });

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(6);

  paginatedMyTranscripts = computed(() => {
    const list = this.filteredMyTranscripts();
    const page = this.currentPage();
    const size = this.pageSize();
    return list.slice((page - 1) * size, page * size);
  });

  emptyStateType = computed<'none' | 'true_empty' | 'search_miss' | 'filter_miss'>(() => {
    if (this.filteredMyTranscripts().length > 0) return 'none';
    if (this.myTranscripts().length === 0) return 'true_empty';
    if (this.searchTerm().trim().length > 0) return 'search_miss';
    return 'filter_miss';
  });

  onSearchChange(val: string) {
    this.searchTerm.set(val);
    this.currentPage.set(1);
  }

  releasedCount = computed(() => this.myTranscripts().filter(t => t.releaseState === 'released').length);
  pendingCount = computed(() => this.myTranscripts().filter(t => t.releaseState === 'pending').length);
  totalCredits = computed(() => this.myTranscripts().reduce((sum, t) => sum + (t.content.totalCredits || 0), 0));

  // KPI Computations for shared app-kpi-card
  kpiReleasedCredentials = computed<Kpi>(() => ({
    title: 'Released Credentials',
    value: String(this.releasedCount()),
    change: `+${this.releasedCount()} verified`,
    icon: 'verified',
    color: 'emerald',
    subtext: 'Verified academic records'
  }));

  kpiTotalCreditHours = computed<Kpi>(() => ({
    title: 'Total Credit Hours',
    value: `${this.totalCredits()} hrs`,
    change: 'Accumulated training',
    icon: 'activity',
    color: 'sky',
    subtext: 'Across completed modules'
  }));

  kpiCertifiedPlans = computed<Kpi>(() => ({
    title: 'Certified Plans',
    value: String(this.countByLevel('plan')),
    change: 'Program completions',
    icon: 'badge',
    color: 'violet',
    subtext: 'Comprehensive programs'
  }));

  kpiAwaitingClosure = computed<Kpi>(() => ({
    title: 'Awaiting Closure',
    value: String(this.pendingCount()),
    change: 'Pending sign-off',
    icon: 'pending',
    color: 'amber',
    subtext: 'Gated on plan sign-off'
  }));

  countByLevel(level: TranscriptLevel): number {
    return this.myTranscripts().filter(t => t.level === level).length;
  }

  selectTab(tab: 'all' | 'course' | 'phase' | 'plan') {
    this.selectedTab.set(tab);
    this.selectedLevel.set(tab);
    this.draftLevel.set(tab);
    this.currentPage.set(1);
  }

  toggleFilterPanel() {
    if (this.isFilterPanelOpen()) {
      this.cancelFilterPanel();
    } else {
      this.openFilterPanel();
    }
  }

  openFilterPanel() {
    this.draftStatus.set(this.selectedStatus());
    this.draftLevel.set(this.selectedLevel());
    this.draftReleaseState.set(this.selectedReleaseState());
    this.draftSort.set(this.selectedSort());
    this.isFilterPanelOpen.set(true);
  }

  cancelFilterPanel() {
    this.isFilterPanelOpen.set(false);
  }

  applyFilterPanel() {
    this.selectedStatus.set(this.draftStatus());
    this.selectedLevel.set(this.draftLevel());
    this.selectedReleaseState.set(this.draftReleaseState());
    this.selectedSort.set(this.draftSort());
    if (this.draftLevel() === 'all' || this.draftLevel() === 'plan' || this.draftLevel() === 'phase' || this.draftLevel() === 'course') {
      this.selectedTab.set(this.draftLevel() as any);
    }
    this.currentPage.set(1);
    this.isFilterPanelOpen.set(false);
  }

  clearDraftFilters() {
    this.draftStatus.set('all');
    this.draftLevel.set('all');
    this.draftReleaseState.set('all');
    this.draftSort.set('newest');
  }

  clearAllFilters() {
    this.searchTerm.set('');
    this.selectedTab.set('all');
    this.selectedLevel.set('all');
    this.selectedStatus.set('all');
    this.selectedReleaseState.set('all');
    this.selectedSort.set('newest');
    this.draftStatus.set('all');
    this.draftLevel.set('all');
    this.draftReleaseState.set('all');
    this.draftSort.set('newest');
    this.currentPage.set(1);
    this.isFilterPanelOpen.set(false);
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
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 uppercase tracking-wider';
      case 'phase':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider';
      case 'course':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pass':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      case 'fail':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      case 'completed':
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      default:
        return 'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200';
    }
  }
}
