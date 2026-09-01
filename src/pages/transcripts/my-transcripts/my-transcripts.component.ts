import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import { TranscriptRecord, TranscriptLevel } from '../../../models/transcript.model';
import { TranscriptSheetComponent } from '../../../components/transcript-sheet/transcript-sheet.component';

@Component({
  selector: 'app-my-transcripts',
  imports: [CommonModule, RouterModule, TranscriptSheetComponent],
  template: `
    <div class="min-h-screen bg-stone-50/50 p-4 sm:p-6 lg:p-8 space-y-6">
      
      <!-- Learner Header -->
      <div class="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div class="flex items-center space-x-2 text-xs text-stone-500 mb-1.5">
            <span>Learner Portal</span>
            <span>/</span>
            <span class="text-stone-900 font-medium">Academic Records</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            My Transcripts
          </h1>
          <p class="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl">
            Official records of your completed courses, training phases, and certified learning plans. Access verified grades and download official PDF transcripts.
          </p>
        </div>

        <!-- Trainee Profile Pill -->
        <div class="flex items-center space-x-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80 shrink-0">
          <img
            [src]="lms.currentUser().avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'"
            [alt]="lms.currentUser().name"
            referrerpolicy="no-referrer"
            class="w-10 h-10 rounded-full object-cover border border-stone-300"
          />
          <div>
            <div class="font-bold text-xs text-stone-900">{{ lms.currentUser().name }}</div>
            <div class="text-[11px] text-stone-500 font-mono">{{ lms.currentUser().id }}</div>
            <span class="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">Active Learner</span>
          </div>
        </div>
      </div>

      <!-- Level Filter Tabs -->
      <div class="flex items-center space-x-2 border-b border-stone-200 pb-3 text-xs font-semibold">
        <button
          (click)="selectedTab.set('all')"
          class="px-3.5 py-1.5 rounded-lg transition-colors"
          [class]="selectedTab() === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'"
        >
          All Transcripts ({{ myTranscripts().length }})
        </button>

        <button
          (click)="selectedTab.set('plan')"
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
          [class]="selectedTab() === 'plan' ? 'bg-purple-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'"
        >
          <span>Plan Level</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'plan' ? 'bg-purple-800 text-white' : 'bg-stone-200 text-stone-700'">
            {{ countByLevel('plan') }}
          </span>
        </button>

        <button
          (click)="selectedTab.set('phase')"
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
          [class]="selectedTab() === 'phase' ? 'bg-blue-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'"
        >
          <span>Phase Level</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'phase' ? 'bg-blue-800 text-white' : 'bg-stone-200 text-stone-700'">
            {{ countByLevel('phase') }}
          </span>
        </button>

        <button
          (click)="selectedTab.set('course')"
          class="px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
          [class]="selectedTab() === 'course' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'"
        >
          <span>Course Level</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full" [class]="selectedTab() === 'course' ? 'bg-emerald-800 text-white' : 'bg-stone-200 text-stone-700'">
            {{ countByLevel('course') }}
          </span>
        </button>
      </div>

      <!-- Transcripts List / Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (t of filteredMyTranscripts(); track t.transcriptId) {
          
          <!-- Released Transcript Card -->
          @if (t.releaseState === 'released') {
            <div class="bg-white rounded-2xl border border-stone-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
              <div class="space-y-3">
                
                <!-- Level & Serial Bar -->
                <div class="flex items-center justify-between">
                  <span [class]="getLevelBadgeClass(t.level)">
                    {{ t.level | uppercase }}
                  </span>
                  <span class="text-[11px] font-mono text-stone-500 font-medium">
                    {{ t.content.serialNumber }}
                  </span>
                </div>

                <!-- Scope Title -->
                <div>
                  <h3 class="text-base font-bold text-stone-900 leading-snug">
                    {{ t.scopeName }}
                  </h3>
                  <p class="text-xs text-stone-500 mt-0.5">
                    Plan: <span class="text-stone-700 font-medium">{{ t.planName }}</span>
                  </p>
                </div>

                <!-- Performance Summary Pill -->
                <div class="p-3 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between text-xs">
                  <div>
                    <div class="text-[10px] text-stone-500 uppercase font-semibold">Score / Result</div>
                    <div class="text-base font-bold text-stone-900 font-mono">{{ t.content.result }}</div>
                  </div>
                  <div class="text-right">
                    <div class="text-[10px] text-stone-500 uppercase font-semibold">Status</div>
                    <span [class]="getStatusBadgeClass(t.content.status)">
                      {{ t.content.status | uppercase }}
                    </span>
                  </div>
                </div>

                <!-- Metadata Row -->
                <div class="grid grid-cols-2 gap-2 text-[11px] text-stone-500 pt-1">
                  <div>Completed: <span class="font-medium text-stone-800">{{ t.content.completionDate }}</span></div>
                  <div class="text-right">Credits: <span class="font-semibold text-stone-800">{{ t.content.totalCredits }} hrs</span></div>
                </div>
              </div>

              <!-- Action Footer -->
              <div class="pt-3 border-t border-stone-100 flex items-center space-x-2">
                <button
                  (click)="viewTranscript(t)"
                  class="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center space-x-1"
                >
                  <span class="material-icons-outlined text-sm">visibility</span>
                  <span>View Transcript</span>
                </button>

                @if (t.downloadEnabled) {
                  <button
                    (click)="downloadPdf(t)"
                    class="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center space-x-1 shadow-xs"
                    title="Download Official PDF"
                  >
                    <span class="material-icons-outlined text-sm">download</span>
                    <span>PDF</span>
                  </button>
                } @else {
                  <span
                    class="px-3 py-2 bg-stone-100 text-stone-400 rounded-xl text-xs flex items-center space-x-1 cursor-not-allowed border border-stone-200"
                    title="Download is not enabled for this transcript."
                  >
                    <span class="material-icons-outlined text-sm text-amber-500">lock</span>
                    <span>PDF</span>
                  </span>
                }
              </div>
            </div>
          }

          <!-- Pending / Plan-Not-Closed Locked Informative Card (§2.1 Gate) -->
          @if (t.releaseState === 'pending') {
            <div class="bg-amber-50/40 rounded-2xl border border-amber-200/80 p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                    Plan Level · Pending Closure
                  </span>
                  <span class="material-icons-outlined text-amber-600 text-base">lock_clock</span>
                </div>

                <div>
                  <h3 class="text-base font-bold text-stone-900 leading-snug">
                    {{ t.scopeName }}
                  </h3>
                  <p class="text-xs text-stone-500 mt-0.5">
                    Plan Completed on <span class="font-semibold text-stone-700">{{ t.content.completionDate }}</span>
                  </p>
                </div>

                <!-- Plan Closed Gate Notice -->
                <div class="p-3 bg-white/90 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div class="font-bold flex items-center gap-1 text-amber-800">
                    <span class="material-icons-outlined text-sm">info</span>
                    Awaiting Plan Administrative Closure
                  </div>
                  <p class="text-[11px] text-stone-600 leading-relaxed">
                    Your Plan transcript will be available after the Plan is completed and closed by the academic directorate.
                  </p>
                </div>
              </div>

              <div class="pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-stone-500">
                <span class="font-mono text-[11px]">Score: {{ t.content.result }}</span>
                <span class="text-amber-700 font-semibold text-[11px]">Gated on Plan Closure</span>
              </div>
            </div>
          }

        }
      </div>

      <!-- True Empty State -->
      @if (filteredMyTranscripts().length === 0) {
        <div class="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <span class="material-icons-outlined text-5xl text-stone-300">school</span>
          <h3 class="text-base font-bold text-stone-800">No transcripts released yet</h3>
          <p class="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            As you complete your assigned courses, training phases, and closed plans, your official academic transcripts will automatically appear here for viewing and verification.
          </p>
          <div class="pt-2">
            <a
              routerLink="/courses"
              class="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <span class="material-icons-outlined text-sm">menu_book</span>
              <span>Go to Course Catalog</span>
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

  selectedTab = signal<'all' | 'course' | 'phase' | 'plan'>('all');
  activeTranscript = signal<TranscriptRecord | null>(null);

  // All transcripts associated with this learner (or all for demo/admin preview)
  myTranscripts = computed(() => {
    const user = this.lms.currentUser();
    // In learner role, get specifically by traineeId; for administrators exploring, fallback to the full list
    const role = this.lms.activeRole();
    if (role === 'learner') {
      return this.lms.transcripts().filter(t => t.traineeId === user.id || t.traineeEmail === user.email);
    }
    return this.lms.transcripts();
  });

  filteredMyTranscripts = computed(() => {
    const list = this.myTranscripts();
    const tab = this.selectedTab();
    if (tab === 'all') return list;
    return list.filter(t => t.level === tab);
  });

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
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200';
      case 'phase':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      case 'course':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pass':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'fail':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200';
      case 'completed':
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200';
      default:
        return 'px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700';
    }
  }
}
