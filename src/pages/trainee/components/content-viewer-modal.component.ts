import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanComponent } from '../../../models/plan.model';
import { TraineePlanService } from '../../../services/trainee-plan.service';

@Component({
  selector: 'app-content-viewer-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/75 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-card m-auto">
        
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-tenant-500/10 text-tenant-600 dark:text-tenant-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">
                {{ component().contentType === 'Video' ? 'movie' : 'description' }}
              </span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-tenant-100 text-tenant-800 dark:bg-tenant-900/40 dark:text-tenant-300">
                  {{ component().contentType || 'Learning Content' }}
                </span>
                <span class="text-xs text-text-secondary">
                  Duration / Length: {{ component().contentLength || '15 mins' }}
                </span>
              </div>
              <h2 class="text-base font-bold text-text-primary mt-0.5">{{ component().name }}</h2>
            </div>
          </div>

          <button 
            type="button" 
            (click)="close.emit()"
            class="w-9 h-9 rounded-full hover:bg-base-300 dark:hover:bg-slate-800 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <!-- Body / Content Reader -->
        <div class="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">

          <!-- Video Player Simulation -->
          @if (component().contentType === 'Video' || component().contentType === 'Recorded Class') {
            <div class="rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg relative aspect-video flex flex-col justify-end">
              <div class="absolute inset-0 flex items-center justify-center">
                <button 
                  type="button"
                  (click)="togglePlayVideo()"
                  class="w-16 h-16 rounded-full bg-tenant-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer">
                  <span class="material-symbols-outlined text-3xl">
                    {{ isPlaying() ? 'pause' : 'play_arrow' }}
                  </span>
                </button>
              </div>

              <!-- Video Bar Simulation -->
              <div class="bg-gradient-to-t from-black/90 to-transparent p-4 space-y-2 z-10">
                <div class="flex items-center justify-between text-[11px] text-slate-300">
                  <span>{{ formatTime(currentTime()) }} / {{ formatTime(totalDuration()) }}</span>
                  <span class="font-bold text-tenant-400">{{ videoProgressPct() }}% Consumed</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-700 overflow-hidden cursor-pointer" (click)="seekVideo($event)">
                  <div class="h-full bg-tenant-500 rounded-full transition-all" [style.width.%]="videoProgressPct()"></div>
                </div>
                <div class="flex items-center justify-between pt-1 text-slate-300 text-xs">
                  <div class="flex items-center gap-3">
                    <button type="button" (click)="togglePlayVideo()" class="hover:text-white cursor-pointer">
                      <span class="material-symbols-outlined text-sm">{{ isPlaying() ? 'pause' : 'play_arrow' }}</span>
                    </button>
                    <button type="button" (click)="advanceTime(10)" class="hover:text-white cursor-pointer text-[10px] font-bold">+10s</button>
                    <span class="text-[11px] text-slate-400">1080p HD • BRAC Learning Hub</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">volume_up</span>
                    <span class="material-symbols-outlined text-sm">fullscreen</span>
                  </div>
                </div>
              </div>
            </div>
          } @else {
            <!-- PDF / Document Simulator -->
            <div class="rounded-2xl border border-base-300 dark:border-slate-800 bg-base-200/40 dark:bg-base-300/20 p-6 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800 text-xs text-text-secondary">
                <span class="flex items-center gap-1.5 font-semibold text-text-primary">
                  <span class="material-symbols-outlined text-base text-rose-500">picture_as_pdf</span>
                  Field_Officer_Standard_Operating_Procedure_v3.pdf
                </span>
                <span>Page {{ currentPdfPage() }} of {{ totalPdfPages() }}</span>
              </div>

              <!-- Document text mockup -->
              <div class="p-6 bg-white dark:bg-slate-900 rounded-xl border border-base-300 dark:border-slate-800 text-text-primary text-xs leading-relaxed space-y-4 shadow-xs">
                <h3 class="text-sm font-bold text-tenant-600 dark:text-tenant-400">
                  Section 2.4: Client Protection Principles & Household Cashflow Assessment
                </h3>
                <p>
                  BRAC’s microfinance operations adhere strictly to the Smart Campaign’s Client Protection Principles. Field Officers must ensure that loan appraisals reflect realistic family income without over-leveraging recipient households.
                </p>
                <div class="p-3.5 rounded-lg bg-tenant-50 dark:bg-tenant-950/30 border border-tenant-200 dark:border-tenant-900/50 text-[11px] space-y-1">
                  <div class="font-bold text-tenant-800 dark:text-tenant-200">Mandatory Inspection Rule:</div>
                  <p class="text-tenant-700 dark:text-tenant-300">
                    Always cross-verify Village Organization (VO) attendance ledgers and ensure loan agreements are signed or thumb-printed in clear presence of the borrower.
                  </p>
                </div>
                <p>
                  Under no circumstances should field personnel retain original borrower national ID cards or land deeds. All grievance redressal channels must be communicated verbally to all village committee members during weekly gatherings.
                </p>
              </div>

              <!-- PDF Pagination Controls -->
              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-2">
                  <button 
                    type="button" 
                    [disabled]="currentPdfPage() <= 1"
                    (click)="changePdfPage(-1)"
                    class="px-3 py-1.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer">
                    Previous Page
                  </button>
                  <button 
                    type="button" 
                    [disabled]="currentPdfPage() >= totalPdfPages()"
                    (click)="changePdfPage(1)"
                    class="px-3 py-1.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40 cursor-pointer">
                    Next Page
                  </button>
                </div>

                <div class="text-xs text-text-secondary">
                  Reading Progress: <strong class="text-tenant-600 dark:text-tenant-400">{{ pdfProgressPct() }}%</strong>
                </div>
              </div>
            </div>
          }

          <!-- Description and Progression Condition Notice -->
          <div class="p-4 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 space-y-2">
            <span class="text-[10px] uppercase font-bold tracking-wider text-text-secondary">Progression Condition</span>
            <div class="text-xs text-text-primary flex items-center gap-2">
              <span class="material-symbols-outlined text-sm text-tenant-600">verified</span>
              <span>
                {{ component().progressionCondition?.label || 'Must consume at least 95% of content or manually mark complete upon review.' }}
              </span>
            </div>
            @if (component().downloadable) {
              <div class="pt-2 flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="downloadMaterial()"
                  class="px-3 py-1.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-xs font-bold text-text-primary hover:bg-base-200 flex items-center gap-1.5 transition-colors cursor-pointer">
                  <span class="material-symbols-outlined text-sm text-tenant-600">download</span>
                  Download Offline Resource
                </button>
                @if (hasDownloaded()) {
                  <span class="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span class="material-symbols-outlined text-xs">check_circle</span> Saved to offline storage
                  </span>
                }
              </div>
            }
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/30">
          <button 
            type="button" 
            (click)="close.emit()"
            class="px-4 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">
            Close Viewer
          </button>

          <button 
            type="button" 
            (click)="markAsComplete()"
            class="px-5 py-2.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
            <span class="material-symbols-outlined text-base">task_alt</span>
            <span>Mark as Completed & Proceed</span>
          </button>
        </div>

      </div>
    </div>
  `
})
export class ContentViewerModalComponent {
  component = input.required<PlanComponent>();
  close = output<void>();
  completed = output<void>();

  private traineeService = inject(TraineePlanService);

  // Video State
  isPlaying = signal(false);
  currentTime = signal(140);
  totalDuration = signal(360); // 6 mins
  videoProgressPct = signal(40);

  // PDF State
  currentPdfPage = signal(3);
  totalPdfPages = signal(8);
  pdfProgressPct = signal(40);

  hasDownloaded = signal(false);

  togglePlayVideo() {
    this.isPlaying.update(v => !v);
    if (this.isPlaying()) {
      this.advanceTime(20);
    }
  }

  advanceTime(seconds: number) {
    const next = Math.min(this.totalDuration(), this.currentTime() + seconds);
    this.currentTime.set(next);
    const pct = Math.round((next / this.totalDuration()) * 100);
    this.videoProgressPct.set(pct);
    this.traineeService.updateContentConsumption(this.component().id, pct, pct >= 95);
  }

  seekVideo(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const pct = Math.round((clickX / rect.width) * 100);
    this.videoProgressPct.set(pct);
    this.currentTime.set(Math.round((pct / 100) * this.totalDuration()));
    this.traineeService.updateContentConsumption(this.component().id, pct, pct >= 95);
  }

  changePdfPage(delta: number) {
    const next = Math.max(1, Math.min(this.totalPdfPages(), this.currentPdfPage() + delta));
    this.currentPdfPage.set(next);
    const pct = Math.round((next / this.totalPdfPages()) * 100);
    this.pdfProgressPct.set(pct);
    this.traineeService.updateContentConsumption(this.component().id, pct, pct >= 95);
  }

  downloadMaterial() {
    this.hasDownloaded.set(true);
    this.traineeService.updateContentConsumption(this.component().id, 100, true);
  }

  markAsComplete() {
    this.traineeService.updateContentConsumption(this.component().id, 100, true);
    this.completed.emit();
    this.close.emit();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
