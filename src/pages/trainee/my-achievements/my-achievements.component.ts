import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TraineePlanService } from '../../../services/trainee-plan.service';
import { TraineeCredential, TRAINEE_PERSONAS } from '../../../models/trainee-plan.model';
import { CertificatePreviewModalComponent } from '../components/certificate-preview-modal.component';

@Component({
  selector: 'app-my-achievements',
  imports: [CommonModule, RouterModule, CertificatePreviewModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 pb-16">
      
      <!-- Persona Simulator Switcher -->
      <div class="p-4 sm:p-5 rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-xl">military_tech</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-text-primary uppercase tracking-wider">Credentials Persona Simulator</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {{ activePersona().name }}
                </span>
              </div>
              <p class="text-xs text-text-secondary mt-0.5">
                Switch personas to preview earned badges, phase certificates, and graduation diplomas with distinction marks.
              </p>
            </div>
          </div>

          <!-- Persona Selector Chips -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            @for (p of personas; track p.id) {
              <button 
                type="button" 
                (click)="switchPersona(p.id)"
                [class.bg-indigo-600]="activePersona().id === p.id"
                [class.text-white]="activePersona().id === p.id"
                [class.shadow-xs]="activePersona().id === p.id"
                [class.bg-base-200]="activePersona().id !== p.id"
                [class.text-text-secondary]="activePersona().id !== p.id"
                class="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer hover:border-indigo-400 border border-transparent">
                <img [src]="p.avatar" [alt]="p.name" class="w-5 h-5 rounded-full object-cover" />
                <span>{{ p.name }}</span>
                <span class="text-[10px] opacity-80 font-normal">({{ p.tag.split(' ')[0] }})</span>
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Top Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-text-primary flex items-center gap-2.5">
            <span class="material-symbols-outlined text-2xl text-amber-500">military_tech</span>
            My Achievements & Credentials
          </h1>
          <p class="text-xs text-text-secondary mt-1">
            Official cryptographic certifications, course competence badges, and program diplomas earned by {{ activePersona().name }}.
          </p>
        </div>

        <a 
          routerLink="/my-plans" 
          class="px-4 py-2 rounded-xl border border-base-300 dark:border-slate-800 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 self-start bg-base-100 dark:bg-base-200">
          <span class="material-symbols-outlined text-sm">arrow_back</span>
          <span>Back to Plans</span>
        </a>
      </div>

      <!-- Filter Tabs -->
      <div class="flex items-center gap-2 p-1.5 bg-base-200/60 dark:bg-base-300/40 rounded-2xl border border-base-300 dark:border-slate-800 overflow-x-auto">
        <button 
          type="button" 
          (click)="filterTab.set('all')"
          [class.bg-base-100]="filterTab() === 'all'"
          [class.dark:bg-base-200]="filterTab() === 'all'"
          [class.text-tenant-600]="filterTab() === 'all'"
          [class.shadow-xs]="filterTab() === 'all'"
          [class.text-text-secondary]="filterTab() !== 'all'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          All Credentials ({{ allCredentials().length }})
        </button>

        <button 
          type="button" 
          (click)="filterTab.set('badges')"
          [class.bg-base-100]="filterTab() === 'badges'"
          [class.dark:bg-base-200]="filterTab() === 'badges'"
          [class.text-tenant-600]="filterTab() === 'badges'"
          [class.shadow-xs]="filterTab() === 'badges'"
          [class.text-text-secondary]="filterTab() !== 'badges'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          Course Badges ({{ badgeCount() }})
        </button>

        <button 
          type="button" 
          (click)="filterTab.set('certificates')"
          [class.bg-base-100]="filterTab() === 'certificates'"
          [class.dark:bg-base-200]="filterTab() === 'certificates'"
          [class.text-tenant-600]="filterTab() === 'certificates'"
          [class.shadow-xs]="filterTab() === 'certificates'"
          [class.text-text-secondary]="filterTab() !== 'certificates'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          Diplomas & Certificates ({{ certificateCount() }})
        </button>

        <button 
          type="button" 
          (click)="filterTab.set('earned')"
          [class.bg-base-100]="filterTab() === 'earned'"
          [class.dark:bg-base-200]="filterTab() === 'earned'"
          [class.text-tenant-600]="filterTab() === 'earned'"
          [class.shadow-xs]="filterTab() === 'earned'"
          [class.text-text-secondary]="filterTab() !== 'earned'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          Earned ({{ earnedCredentials().length }})
        </button>

        <button 
          type="button" 
          (click)="filterTab.set('locked')"
          [class.bg-base-100]="filterTab() === 'locked'"
          [class.dark:bg-base-200]="filterTab() === 'locked'"
          [class.text-tenant-600]="filterTab() === 'locked'"
          [class.shadow-xs]="filterTab() === 'locked'"
          [class.text-text-secondary]="filterTab() !== 'locked'"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap">
          Still to Earn ({{ lockedCredentials().length }})
        </button>
      </div>

      <!-- Credentials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (cred of displayedCredentials(); track cred.id) {
          <div 
            class="p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4"
            [class.bg-base-100]="cred.status === 'Earned'"
            [class.dark:bg-base-200]="cred.status === 'Earned'"
            [class.border-base-300]="cred.status === 'Earned'"
            [class.dark:border-slate-800]="cred.status === 'Earned'"
            [class.shadow-sm]="cred.status === 'Earned'"
            [class.hover:shadow-md]="cred.status === 'Earned'"
            [class.bg-base-200/40]="cred.status !== 'Earned'"
            [class.dark:bg-base-300/10]="cred.status !== 'Earned'"
            [class.border-dashed]="cred.status !== 'Earned'"
            [class.border-base-300]="cred.status !== 'Earned'">
            
            <div class="space-y-3.5">
              
              <!-- Card Top Row -->
              <div class="flex items-start justify-between">
                <div 
                  class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
                  [class.bg-amber-500/10]="cred.status === 'Earned' && cred.type === 'certificate'"
                  [class.text-amber-600]="cred.status === 'Earned' && cred.type === 'certificate'"
                  [class.bg-tenant-500/10]="cred.status === 'Earned' && cred.type === 'badge'"
                  [class.text-tenant-600]="cred.status === 'Earned' && cred.type === 'badge'"
                  [class.bg-base-200]="cred.status !== 'Earned'"
                  [class.text-text-secondary]="cred.status !== 'Earned'">
                  <span class="material-symbols-outlined text-2xl">
                    {{ cred.type === 'badge' ? 'military_tech' : 'workspace_premium' }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap justify-end">
                  @if (cred.grade) {
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300/40">
                      ★ {{ cred.grade }}
                    </span>
                  }
                  
                  <span 
                    class="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"
                    [class.bg-emerald-100]="cred.status === 'Earned'"
                    [class.text-emerald-800]="cred.status === 'Earned'"
                    [class.dark:bg-emerald-950/40]="cred.status === 'Earned'"
                    [class.dark:text-emerald-300]="cred.status === 'Earned'"
                    [class.bg-base-200]="cred.status !== 'Earned'"
                    [class.text-text-secondary]="cred.status !== 'Earned'">
                    <span class="material-symbols-outlined text-xs">
                      {{ cred.status === 'Earned' ? 'verified' : 'lock' }}
                    </span>
                    {{ cred.status }}
                  </span>
                </div>
              </div>

              <!-- Title & Context -->
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  {{ cred.type === 'badge' ? 'Digital Course Badge' : (cred.title.includes('Diploma') ? 'Program Graduation Diploma' : 'Phase Official Certificate') }}
                </span>
                <h3 class="text-base font-bold text-text-primary mt-0.5">{{ cred.title }}</h3>
                <p class="text-xs text-text-secondary mt-1 leading-relaxed">{{ cred.subtitle }}</p>
                <div class="text-[11px] text-text-secondary pt-2">
                  <span>Pathway: <strong class="text-text-primary">{{ cred.planName }}</strong></span>
                </div>
              </div>

              <!-- Skill Tags (User Specification Requirement) -->
              @if (cred.skills && cred.skills.length > 0) {
                <div class="pt-1">
                  <div class="text-[10px] font-semibold text-text-secondary mb-1">Competency Tags:</div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    @for (skill of cred.skills; track skill) {
                      <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-base-200 dark:bg-base-300 text-text-primary">
                        #{{ skill }}
                      </span>
                    }
                  </div>
                </div>
              }

              <!-- Verification Code Stamp -->
              @if (cred.verificationCode) {
                <div class="p-2.5 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 text-[10px] font-mono text-text-secondary flex items-center justify-between">
                  <span>Code: <strong class="text-text-primary">{{ cred.verificationCode }}</strong></span>
                  <span class="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                    <span class="material-symbols-outlined text-xs">check_circle</span>
                    Verified
                  </span>
                </div>
              }
            </div>

            <!-- Card Actions -->
            <div class="pt-3 border-t border-base-300 dark:border-slate-800 flex items-center justify-between">
              @if (cred.status === 'Earned') {
                <button 
                  type="button" 
                  (click)="selectedCred.set(cred)"
                  class="px-4 py-2 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                  <span class="material-symbols-outlined text-sm">visibility</span>
                  <span>View & Print Certificate</span>
                </button>

                @if (cred.issueDate) {
                  <span class="text-[10px] text-text-secondary font-medium">
                    Issued: {{ cred.issueDate }}
                  </span>
                }
              } @else {
                <span class="text-[11px] font-semibold text-text-secondary flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs text-amber-500">lock</span>
                  <span>Complete curriculum to earn</span>
                </span>
              }
            </div>

          </div>
        }
      </div>

      @if (displayedCredentials().length === 0) {
        <div class="p-12 text-center rounded-3xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 space-y-3">
          <span class="material-symbols-outlined text-3xl text-text-secondary">workspace_premium</span>
          <h3 class="text-base font-bold text-text-primary">No Credentials Found in this View</h3>
          <p class="text-xs text-text-secondary">Try switching the filter tab or selecting another trainee persona.</p>
        </div>
      }

      <!-- Full Screen Certificate Preview Modal -->
      @if (selectedCred()) {
        <app-certificate-preview-modal
          [credential]="selectedCred()!"
          (close)="selectedCred.set(null)">
        </app-certificate-preview-modal>
      }

    </div>
  `
})
export class MyAchievementsComponent {
  private traineeService = inject(TraineePlanService);

  personas = TRAINEE_PERSONAS;
  activePersona = this.traineeService.activePersona;

  filterTab = signal<'all' | 'badges' | 'certificates' | 'earned' | 'locked'>('all');
  selectedCred = signal<TraineeCredential | null>(null);

  allCredentials = computed<TraineeCredential[]>(() => {
    return this.traineeService.getAllCredentials(this.activePersona());
  });

  badgeCount = computed(() => this.allCredentials().filter(c => c.type === 'badge').length);
  certificateCount = computed(() => this.allCredentials().filter(c => c.type === 'certificate').length);

  earnedCredentials = computed<TraineeCredential[]>(() => {
    return this.allCredentials().filter(c => c.status === 'Earned');
  });

  lockedCredentials = computed<TraineeCredential[]>(() => {
    return this.allCredentials().filter(c => c.status === 'Locked');
  });

  displayedCredentials = computed<TraineeCredential[]>(() => {
    const all = this.allCredentials();
    const tab = this.filterTab();
    if (tab === 'badges') return all.filter(c => c.type === 'badge');
    if (tab === 'certificates') return all.filter(c => c.type === 'certificate');
    if (tab === 'earned') return all.filter(c => c.status === 'Earned');
    if (tab === 'locked') return all.filter(c => c.status === 'Locked');
    return all;
  });

  switchPersona(id: string) {
    this.traineeService.setPersona(id);
  }
}
