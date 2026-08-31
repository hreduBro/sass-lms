import { Component, inject, input, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  FeedbackForm, 
  FeedbackFormVersion, 
  FeedbackQuestion, 
  FeedbackResponse,
  FeedbackQuestionType 
} from '../../../models/engagement.model';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';

@Component({
  selector: 'app-feedback-studio',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CustomAvatarComponent],
  template: `
    <div class="space-y-6">
      
      <!-- Studio Header & Sub-Tab Switcher -->
      <div class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
              One per Plan • Immutable Versioning Engine
            </span>
            <span class="text-xs text-text-secondary">• Active Version: <strong>{{ activeForm()?.versions?.slice(-1)?.[0]?.versionLabel || 'v1' }}</strong></span>
          </div>
          <h2 class="text-lg font-bold text-text-primary mt-1">{{ activeForm()?.title || 'Plan Feedback Questionnaire' }}</h2>
          <p class="text-xs text-text-secondary mt-0.5 max-w-2xl">
            {{ activeForm()?.description || 'Curriculum and delivery feedback instrument. Historical responses are immutably tied to the exact version answered.' }}
          </p>
        </div>

        <!-- Mode / Sub-Tabs -->
        <div class="flex items-center gap-2 p-1 bg-base-200 dark:bg-base-300/50 rounded-xl border border-base-300 dark:border-slate-800 self-start md:self-auto">
          <button 
            type="button" 
            (click)="activeSubTab.set('responses')"
            [class.bg-base-100]="activeSubTab() === 'responses'"
            [class.shadow-xs]="activeSubTab() === 'responses'"
            [class.text-text-primary]="activeSubTab() === 'responses'"
            [class.text-text-secondary]="activeSubTab() !== 'responses'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">analytics</span>
            <span>Responses Grid ({{ planResponses().length }})</span>
          </button>

          <button 
            type="button" 
            (click)="activeSubTab.set('versions')"
            [class.bg-base-100]="activeSubTab() === 'versions'"
            [class.shadow-xs]="activeSubTab() === 'versions'"
            [class.text-text-primary]="activeSubTab() === 'versions'"
            [class.text-text-secondary]="activeSubTab() !== 'versions'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">history_edu</span>
            <span>Versions & Builder</span>
          </button>

          <button 
            type="button" 
            (click)="activeSubTab.set('submit-simulator')"
            [class.bg-base-100]="activeSubTab() === 'submit-simulator'"
            [class.shadow-xs]="activeSubTab() === 'submit-simulator'"
            [class.text-text-primary]="activeSubTab() === 'submit-simulator'"
            [class.text-text-secondary]="activeSubTab() !== 'submit-simulator'"
            class="px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
            <span class="material-symbols-outlined text-sm">rate_review</span>
            <span>Trainee Submission Form</span>
          </button>
        </div>
      </div>

      <!-- ================================================================= -->
      <!-- TAB 1: RESPONSES & REPORTING GRID                                  -->
      <!-- ================================================================= -->
      @if (activeSubTab() === 'responses') {
        <div class="space-y-4 animate-fade-in">
          
          <!-- Filter Toolbar -->
          <div class="p-4 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center flex-wrap gap-3">
              
              <!-- Search Keyword -->
              <div class="relative min-w-[220px]">
                <span class="material-symbols-outlined text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm">search</span>
                <input 
                  type="text"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search trainee name or text..."
                  class="w-full pl-9 pr-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs text-text-primary focus:outline-none focus:border-tenant-600" />
              </div>

              <!-- Version Filter -->
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-semibold text-text-secondary">Version:</span>
                <select 
                  [ngModel]="selectedVersionFilter()"
                  (ngModelChange)="selectedVersionFilter.set($event)"
                  class="px-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary focus:outline-none">
                  <option value="all">All Form Versions</option>
                  @for (v of activeForm()?.versions || []; track v.versionId) {
                    <option [value]="v.versionId">{{ v.versionLabel }} ({{ v.state }})</option>
                  }
                </select>
              </div>

              <!-- Privacy / Anonymity Filter -->
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-semibold text-text-secondary">Privacy:</span>
                <select 
                  [ngModel]="selectedPrivacyFilter()"
                  (ngModelChange)="selectedPrivacyFilter.set($event)"
                  class="px-3 py-1.5 rounded-xl bg-base-200/60 border border-base-300 dark:border-slate-700 text-xs font-medium text-text-primary focus:outline-none">
                  <option value="all">All Submissions</option>
                  <option value="identified">Identified Trainees</option>
                  <option value="anonymous">Anonymous Only</option>
                </select>
              </div>

            </div>

            <!-- Total Stats Chip -->
            <div class="text-xs text-text-secondary font-medium">
              Showing <strong>{{ filteredResponses().length }}</strong> of {{ planResponses().length }} submissions
            </div>
          </div>

          <!-- Responses Table -->
          @if (planResponses().length === 0) {
            <!-- Empty State (§3.5: No responses recorded) -->
            <div class="p-12 text-center rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800">
              <span class="material-symbols-outlined text-4xl text-text-secondary/40">description</span>
              <p class="text-xs font-bold text-text-primary mt-2">No response information is available to display.</p>
              <p class="text-[11px] text-text-secondary mt-1">Once trainees complete this plan or phase, their feedback will appear here in real-time.</p>
              <button 
                type="button" 
                (click)="activeSubTab.set('submit-simulator')"
                class="mt-4 px-4 py-2 rounded-xl text-xs font-bold btn-gradient text-white shadow-sm cursor-pointer">
                Launch Trainee Submission Simulator
              </button>
            </div>
          } @else if (filteredResponses().length === 0) {
            <!-- Filtered Empty State (§3.5: No matching search) -->
            <div class="p-12 text-center rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800">
              <span class="material-symbols-outlined text-4xl text-text-secondary/40">filter_list_off</span>
              <p class="text-xs font-bold text-text-primary mt-2">No response found matching the selected filters.</p>
              <p class="text-[11px] text-text-secondary mt-1">Try changing the version or clearing your keyword filter.</p>
              <button 
                type="button" 
                (click)="resetFilters()"
                class="mt-3 px-3.5 py-1.5 rounded-xl bg-base-200 hover:bg-base-300 text-xs font-semibold text-text-primary">
                Reset Filters
              </button>
            </div>
          } @else {
            <div class="rounded-2xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 overflow-hidden shadow-sm">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="border-b border-base-300 dark:border-slate-800 bg-base-200/50 dark:bg-base-300/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                      <th class="py-3 px-4">Trainee / Participant</th>
                      <th class="py-3 px-4">Form Version</th>
                      <th class="py-3 px-4">Associated Phase</th>
                      <th class="py-3 px-4">Submitted Timestamp</th>
                      <th class="py-3 px-4 text-center">Answered Items</th>
                      <th class="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-base-300 dark:divide-slate-800/80">
                    @for (resp of filteredResponses(); track resp.responseId) {
                      <tr class="hover:bg-base-200/40 dark:hover:bg-base-300/30 transition-colors">
                        
                        <!-- Trainee Info -->
                        <td class="py-3 px-4">
                          @if (resp.isAnonymous) {
                            <div class="flex items-center gap-2.5">
                              <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center">
                                <span class="material-symbols-outlined text-base">visibility_off</span>
                              </div>
                              <div>
                                <span class="font-bold text-text-primary italic">Anonymous Trainee</span>
                                <span class="text-[10px] text-text-secondary block">Identity Protected</span>
                              </div>
                            </div>
                          } @else {
                            <div class="flex items-center gap-2.5">
                              <app-custom-avatar [name]="resp.traineeName || 'Trainee'" [url]="resp.traineeAvatar" size="sm" shape="squircle"></app-custom-avatar>
                              <div>
                                <span class="font-bold text-text-primary">{{ resp.traineeName }}</span>
                                <span class="text-[10px] text-text-secondary block">{{ resp.traineeEmail || 'trainee@brac.net' }}</span>
                              </div>
                            </div>
                          }
                        </td>

                        <!-- Form Version -->
                        <td class="py-3 px-4 whitespace-nowrap">
                          <span class="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                            {{ resp.versionLabel }}
                          </span>
                        </td>

                        <!-- Associated Phase -->
                        <td class="py-3 px-4">
                          <span class="text-text-primary font-medium">{{ resp.phaseName || 'Full Plan Scope' }}</span>
                        </td>

                        <!-- Timestamp -->
                        <td class="py-3 px-4 whitespace-nowrap text-text-secondary">
                          <div class="flex items-center gap-1 font-mono text-[11px]">
                            <span class="material-symbols-outlined text-xs text-text-secondary">schedule</span>
                            <span>{{ resp.submittedAt }}</span>
                          </div>
                        </td>

                        <!-- Items Answered -->
                        <td class="py-3 px-4 text-center">
                          <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {{ resp.answers.length }} answered
                          </span>
                        </td>

                        <!-- Action: Inspect Response -->
                        <td class="py-3 px-4 text-right">
                          <button 
                            type="button" 
                            (click)="inspectResponse(resp)"
                            class="px-3 py-1.5 rounded-xl bg-base-200 hover:bg-tenant-50 hover:text-tenant-600 dark:hover:bg-tenant-950/30 text-text-primary font-semibold text-xs transition-colors inline-flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                            <span>Inspect</span>
                          </button>
                        </td>

                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

        </div>
      }

      <!-- ================================================================= -->
      <!-- TAB 2: VERSIONS HISTORY & BUILDER                                  -->
      <!-- ================================================================= -->
      @if (activeSubTab() === 'versions') {
        <div class="space-y-6 animate-fade-in">
          
          <!-- Version Fork Action Banner -->
          <div class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-sm font-bold text-text-primary">Immutable Version History</h3>
              <p class="text-xs text-text-secondary mt-0.5">
                Modifying questions forks a new version (copy-on-edit). All prior responses remain permanently anchored to their original questionnaire.
              </p>
            </div>
            <button 
              type="button" 
              (click)="openFormBuilder()"
              class="px-4 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              <span class="material-symbols-outlined text-sm">add_circle</span>
              <span>Fork & Edit New Version</span>
            </button>
          </div>

          <!-- Version Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (ver of activeForm()?.versions || []; track ver.versionId) {
              <div 
                [class.border-tenant-500]="ver.state === 'published-current'"
                [class.dark:border-tenant-500]="ver.state === 'published-current'"
                class="p-5 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                        {{ ver.versionLabel }}
                      </span>
                      <span 
                        [ngClass]="ver.state === 'published-current' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'"
                        class="px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {{ ver.state === 'published-current' ? 'Active / Current' : 'Superseded (Immutable)' }}
                      </span>
                    </div>

                    <span class="text-[11px] font-semibold text-text-secondary">
                      {{ ver.responseCount }} Responses
                    </span>
                  </div>

                  <p class="text-xs font-bold text-text-primary mt-3">{{ ver.changeSummary || 'Baseline Version' }}</p>
                  <p class="text-[11px] text-text-secondary mt-1">
                    Published on {{ ver.publishedAt }} by {{ ver.publishedBy }}
                  </p>

                  <!-- Questions Summary -->
                  <div class="mt-4 pt-3 border-t border-base-300/60 dark:border-slate-800/60 space-y-1.5">
                    <span class="text-[10px] uppercase font-bold text-text-secondary tracking-wider block">Question Structure ({{ ver.questions.length }} items):</span>
                    @for (q of ver.questions; track q.questionId) {
                      <div class="text-[11px] text-text-primary flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-xs text-text-secondary">
                          {{ q.type === 'text' ? 'short_text' : (q.type === 'singleSelect' ? 'radio_button_checked' : 'check_box') }}
                        </span>
                        <span class="font-medium text-text-secondary truncate max-w-[280px]">Q{{ q.order }}: {{ q.text }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-base-300/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
                  <span class="text-[10px] font-mono text-text-secondary">ID: {{ ver.versionId }}</span>
                  <button 
                    type="button"
                    (click)="previewVersionQuestions(ver)"
                    class="text-tenant-600 dark:text-tenant-400 font-bold hover:underline">
                    View Full Questionnaire →
                  </button>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- ================================================================= -->
      <!-- TAB 3: TRAINEE FEEDBACK SUBMISSION SIMULATOR                      -->
      <!-- ================================================================= -->
      @if (activeSubTab() === 'submit-simulator') {
        <div class="max-w-2xl mx-auto space-y-6 animate-fade-in">
          
          <div class="p-6 rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-sm">
            <div class="flex items-center justify-between gap-4 pb-4 border-b border-base-300 dark:border-slate-800">
              <div>
                <span class="text-[10px] uppercase font-bold text-tenant-600 dark:text-tenant-400 tracking-wider">Learner Runtime Form</span>
                <h3 class="text-base font-bold text-text-primary mt-0.5">{{ activeForm()?.title }}</h3>
                <p class="text-xs text-text-secondary mt-0.5">Answering against version <strong>{{ currentPublishedVersion()?.versionLabel }}</strong></p>
              </div>
              
              <!-- Anonymous Toggle -->
              <label class="flex items-center gap-2 text-xs font-semibold text-text-primary cursor-pointer">
                <input 
                  type="checkbox" 
                  [ngModel]="submissionIsAnonymous()"
                  (ngModelChange)="submissionIsAnonymous.set($event)"
                  class="rounded text-tenant-600 focus:ring-tenant-500 w-4 h-4" />
                <span>Submit Anonymously</span>
              </label>
            </div>

            <!-- Questions Form -->
            <form (ngSubmit)="submitTraineeFeedback()" class="mt-6 space-y-6 text-xs">
              
              @for (q of currentPublishedVersion()?.questions || []; track q.questionId; let i = $index) {
                <div class="p-4 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 space-y-3">
                  <div class="flex items-start justify-between gap-2">
                    <label class="font-bold text-text-primary leading-snug">
                      {{ i + 1 }}. {{ q.text }}
                      @if (q.required) {
                        <span class="text-rose-500 font-bold ml-0.5">*</span>
                      }
                    </label>
                    <span class="text-[10px] font-semibold text-text-secondary uppercase px-1.5 py-0.5 bg-base-100 dark:bg-base-200 rounded">
                      {{ q.type === 'text' ? 'Text Response' : (q.type === 'singleSelect' ? 'Single Choice' : 'Multiple Choice') }}
                    </span>
                  </div>

                  <!-- Text Input -->
                  @if (q.type === 'text') {
                    <textarea 
                      [ngModel]="simulationAnswers()[q.questionId]?.text || ''"
                      (ngModelChange)="updateTextAnswer(q.questionId, $event)"
                      [name]="'q_' + q.questionId"
                      rows="3"
                      [placeholder]="q.placeholder || 'Type your response here...'"
                      class="w-full px-3 py-2 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-tenant-600">
                    </textarea>
                  }

                  <!-- Single Select -->
                  @if (q.type === 'singleSelect') {
                    <div class="space-y-2">
                      @for (opt of q.options || []; track opt.optionId) {
                        <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300/60 dark:border-slate-800 hover:border-tenant-500 transition-colors cursor-pointer">
                          <input 
                            type="radio" 
                            [name]="'q_radio_' + q.questionId"
                            [value]="opt.optionId"
                            [checked]="simulationAnswers()[q.questionId]?.selectedOptionIds?.[0] === opt.optionId"
                            (change)="updateSingleSelectAnswer(q.questionId, opt.optionId)"
                            class="text-tenant-600 focus:ring-tenant-500 w-4 h-4" />
                          <span class="text-text-primary font-medium">{{ opt.text }}</span>
                        </label>
                      }
                    </div>
                  }

                  <!-- Multi Select -->
                  @if (q.type === 'multiSelect') {
                    <div class="space-y-2">
                      @for (opt of q.options || []; track opt.optionId) {
                        <label class="flex items-center gap-2.5 p-2.5 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300/60 dark:border-slate-800 hover:border-tenant-500 transition-colors cursor-pointer">
                          <input 
                            type="checkbox" 
                            [checked]="isMultiOptionSelected(q.questionId, opt.optionId)"
                            (change)="toggleMultiOption(q.questionId, opt.optionId)"
                            class="rounded text-tenant-600 focus:ring-tenant-500 w-4 h-4" />
                          <span class="text-text-primary font-medium">{{ opt.text }}</span>
                        </label>
                      }
                    </div>
                  }

                </div>
              }

              <!-- Submit Action -->
              <div class="pt-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-between">
                <span class="text-[11px] text-text-secondary">
                  Responses are securely recorded against version <strong>{{ currentPublishedVersion()?.versionLabel }}</strong>.
                </span>
                <button 
                  type="submit" 
                  class="px-6 py-2.5 rounded-xl btn-gradient text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer">
                  Submit Feedback
                </button>
              </div>

            </form>

          </div>

        </div>
      }

      <!-- ===================================================================== -->
      <!-- MODAL: INSPECT RESPONSE AGAINST VERSION                               -->
      <!-- ===================================================================== -->
      @if (inspectingResponse()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="w-full max-w-xl rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div class="p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-tenant-100 dark:bg-tenant-900/40 text-tenant-700 dark:text-tenant-300">
                    Form Version: {{ inspectingResponse()!.versionLabel }}
                  </span>
                  <span class="text-[11px] text-text-secondary">{{ inspectingResponse()!.submittedAt }}</span>
                </div>
                <h3 class="text-sm font-bold text-text-primary mt-1">
                  Submission from {{ inspectingResponse()!.isAnonymous ? 'Anonymous Trainee' : inspectingResponse()!.traineeName }}
                </h3>
              </div>
              <button 
                type="button" 
                (click)="inspectingResponse.set(null)"
                class="w-7 h-7 rounded-lg hover:bg-base-300 flex items-center justify-center text-text-secondary">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-4 text-xs">
              @for (item of inspectedVersionQuestions(); track item.questionId; let idx = $index) {
                <div class="p-4 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800">
                  <h4 class="font-bold text-text-primary leading-snug">Q{{ idx + 1 }}: {{ item.text }}</h4>
                  
                  <div class="mt-2 text-text-secondary">
                    @let ans = getAnswerForQuestion(item.questionId);
                    @if (!ans) {
                      <span class="italic text-slate-400">No answer provided.</span>
                    } @else if (item.type === 'text') {
                      <p class="p-3 rounded-lg bg-base-100 dark:bg-base-200 font-medium text-text-primary border border-base-300/60 dark:border-slate-700">
                        "{{ ans.text || 'No comments' }}"
                      </p>
                    } @else if (item.type === 'singleSelect') {
                      <div class="space-y-1 mt-1">
                        @for (opt of item.options || []; track opt.optionId) {
                          <div 
                            [class.font-bold]="ans.selectedOptionIds?.includes(opt.optionId)"
                            [class.text-tenant-700]="ans.selectedOptionIds?.includes(opt.optionId)"
                            [class.dark:text-tenant-300]="ans.selectedOptionIds?.includes(opt.optionId)"
                            class="flex items-center gap-1.5 text-xs">
                            <span class="material-symbols-outlined text-sm">
                              {{ ans.selectedOptionIds?.includes(opt.optionId) ? 'radio_button_checked' : 'radio_button_unchecked' }}
                            </span>
                            <span>{{ opt.text }}</span>
                          </div>
                        }
                      </div>
                    } @else if (item.type === 'multiSelect') {
                      <div class="space-y-1 mt-1">
                        @for (opt of item.options || []; track opt.optionId) {
                          <div 
                            [class.font-bold]="ans.selectedOptionIds?.includes(opt.optionId)"
                            [class.text-tenant-700]="ans.selectedOptionIds?.includes(opt.optionId)"
                            [class.dark:text-tenant-300]="ans.selectedOptionIds?.includes(opt.optionId)"
                            class="flex items-center gap-1.5 text-xs">
                            <span class="material-symbols-outlined text-sm">
                              {{ ans.selectedOptionIds?.includes(opt.optionId) ? 'check_box' : 'check_box_outline_blank' }}
                            </span>
                            <span>{{ opt.text }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="p-4 border-t border-base-300 dark:border-slate-800 bg-base-200/40 text-right">
              <button 
                type="button" 
                (click)="inspectingResponse.set(null)"
                class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-semibold text-xs">
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ===================================================================== -->
      <!-- MODAL: FORK & EDIT NEW FORM VERSION (BUILDER)                         -->
      <!-- ===================================================================== -->
      @if (showBuilderModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div class="w-full max-w-2xl rounded-2xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div class="p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/30">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-tenant-600 text-white flex items-center justify-center">
                  <span class="material-symbols-outlined text-lg">design_services</span>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-text-primary">Form Builder — Fork New Version</h3>
                  <p class="text-[11px] text-text-secondary">Copy-on-edit architecture protects historical responses.</p>
                </div>
              </div>
              <button 
                type="button" 
                (click)="showBuilderModal.set(false)"
                class="w-7 h-7 rounded-lg hover:bg-base-300 flex items-center justify-center text-text-secondary">
                <span class="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div class="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              <!-- Version Release Notes -->
              <div class="p-4 rounded-xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-800">
                <label class="font-bold text-text-primary block mb-1">Version Release Notes / Change Summary</label>
                <input 
                  type="text" 
                  [ngModel]="builderChangeSummary()"
                  (ngModelChange)="builderChangeSummary.set($event)"
                  placeholder="e.g. Added instructor responsiveness metric and updated Village Org options"
                  class="w-full px-3 py-2 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary text-xs focus:outline-none focus:border-tenant-600" />
              </div>

              <!-- Question List Builder -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h4 class="font-bold text-text-primary uppercase tracking-wider text-[11px]">Questions ({{ builderQuestions().length }})</h4>
                  <div class="flex items-center gap-2">
                    <button 
                      type="button" 
                      (click)="addQuestion('singleSelect')"
                      class="px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-text-primary text-[11px] font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">radio_button_checked</span>
                      <span>+ Single Choice</span>
                    </button>
                    <button 
                      type="button" 
                      (click)="addQuestion('multiSelect')"
                      class="px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-text-primary text-[11px] font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">check_box</span>
                      <span>+ Multi Choice</span>
                    </button>
                    <button 
                      type="button" 
                      (click)="addQuestion('text')"
                      class="px-2.5 py-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-text-primary text-[11px] font-semibold flex items-center gap-1">
                      <span class="material-symbols-outlined text-xs">short_text</span>
                      <span>+ Text</span>
                    </button>
                  </div>
                </div>

                @for (q of builderQuestions(); track q.questionId; let qIdx = $index) {
                  <div class="p-4 rounded-xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 space-y-3">
                    <div class="flex items-center justify-between gap-3">
                      <span class="font-bold text-tenant-600 dark:text-tenant-400">Question {{ qIdx + 1 }}</span>
                      
                      <div class="flex items-center gap-2">
                        <label class="flex items-center gap-1.5 text-[11px] text-text-secondary cursor-pointer">
                          <input 
                            type="checkbox" 
                            [checked]="q.required" 
                            (change)="toggleRequired(qIdx)"
                            class="rounded text-tenant-600 w-3.5 h-3.5" />
                          <span>Mandatory</span>
                        </label>
                        <button 
                          type="button" 
                          (click)="removeQuestion(qIdx)"
                          class="text-rose-500 hover:text-rose-700 p-1 rounded">
                          <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <input 
                      type="text" 
                      [ngModel]="q.text"
                      (ngModelChange)="updateQuestionText(qIdx, $event)"
                      placeholder="Enter question prompt..."
                      class="w-full px-3 py-2 rounded-xl bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary font-semibold focus:outline-none focus:border-tenant-600" />

                    <!-- Options for Choice Questions -->
                    @if (q.type === 'singleSelect' || q.type === 'multiSelect') {
                      <div class="pl-3 border-l-2 border-tenant-500/40 space-y-2 mt-2">
                        <span class="text-[10px] font-bold uppercase text-text-secondary block">Choice Options:</span>
                        @for (opt of q.options || []; track opt.optionId; let optIdx = $index) {
                          <div class="flex items-center gap-2">
                            <input 
                              type="text" 
                              [ngModel]="opt.text"
                              (ngModelChange)="updateOptionText(qIdx, optIdx, $event)"
                              placeholder="Option label..."
                              class="flex-1 px-3 py-1.5 rounded-lg bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-700 text-text-primary text-xs" />
                            <button 
                              type="button" 
                              (click)="removeOption(qIdx, optIdx)"
                              class="text-slate-400 hover:text-rose-500">
                              <span class="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        }
                        <button 
                          type="button" 
                          (click)="addOption(qIdx)"
                          class="text-[11px] font-bold text-tenant-600 dark:text-tenant-400 hover:underline">
                          + Add Option
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

            </div>

            <!-- Modal Action Buttons -->
            <div class="p-4 border-t border-base-300 dark:border-slate-800 bg-base-200/50 flex items-center justify-between">
              <span class="text-[11px] text-text-secondary">
                Publishing will set this as current active questionnaire version.
              </span>
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  (click)="showBuilderModal.set(false)"
                  class="px-4 py-2 rounded-xl bg-base-200 hover:bg-base-300 text-text-primary font-semibold">
                  Cancel
                </button>
                <button 
                  type="button" 
                  (click)="publishNewVersion()"
                  class="px-5 py-2 rounded-xl btn-gradient text-white font-bold shadow-sm cursor-pointer">
                  Publish New Version
                </button>
              </div>
            </div>

          </div>
        </div>
      }

    </div>
  `
})
export class FeedbackStudioComponent implements OnInit {
  private lmsData = inject(LmsDataService);

  planId = input.required<string>();

  activeSubTab = signal<'responses' | 'versions' | 'submit-simulator'>('responses');
  searchQuery = signal<string>('');
  selectedVersionFilter = signal<string>('all');
  selectedPrivacyFilter = signal<string>('all');

  inspectingResponse = signal<FeedbackResponse | null>(null);
  showBuilderModal = signal<boolean>(false);
  builderChangeSummary = signal<string>('');
  builderQuestions = signal<FeedbackQuestion[]>([]);

  submissionIsAnonymous = signal<boolean>(false);
  simulationAnswers = signal<{ [qId: string]: { text?: string; selectedOptionIds?: string[] } }>({});

  activeForm = computed<FeedbackForm | undefined>(() => {
    return this.lmsData.getFeedbackFormForPlan(this.planId());
  });

  currentPublishedVersion = computed<FeedbackFormVersion | undefined>(() => {
    const form = this.activeForm();
    if (!form) return undefined;
    return form.versions.find(v => v.versionId === form.currentVersionId) || form.versions[form.versions.length - 1];
  });

  planResponses = computed<FeedbackResponse[]>(() => {
    return this.lmsData.getFeedbackResponsesForPlan(this.planId());
  });

  filteredResponses = computed<FeedbackResponse[]>(() => {
    let list = this.planResponses();
    const q = this.searchQuery().toLowerCase().trim();
    const ver = this.selectedVersionFilter();
    const priv = this.selectedPrivacyFilter();

    if (ver !== 'all') {
      list = list.filter(r => r.feedbackFormVersionId === ver);
    }
    if (priv === 'anonymous') {
      list = list.filter(r => r.isAnonymous);
    } else if (priv === 'identified') {
      list = list.filter(r => !r.isAnonymous);
    }
    if (q) {
      list = list.filter(r => 
        (r.traineeName && r.traineeName.toLowerCase().includes(q)) ||
        r.answers.some(a => a.text && a.text.toLowerCase().includes(q))
      );
    }
    return list;
  });

  inspectedVersionQuestions = computed<FeedbackQuestion[]>(() => {
    const resp = this.inspectingResponse();
    if (!resp) return [];
    const form = this.activeForm();
    const ver = form?.versions.find(v => v.versionId === resp.feedbackFormVersionId);
    return ver ? ver.questions : [];
  });

  ngOnInit() {
    this.resetSimulationAnswers();
  }

  resetSimulationAnswers() {
    const ver = this.currentPublishedVersion();
    if (!ver) return;
    const ans: { [qId: string]: { text?: string; selectedOptionIds?: string[] } } = {};
    ver.questions.forEach(q => {
      ans[q.questionId] = { text: '', selectedOptionIds: [] };
    });
    this.simulationAnswers.set(ans);
  }

  resetFilters() {
    this.searchQuery.set('');
    this.selectedVersionFilter.set('all');
    this.selectedPrivacyFilter.set('all');
  }

  inspectResponse(resp: FeedbackResponse) {
    this.inspectingResponse.set(resp);
  }

  getAnswerForQuestion(qId: string) {
    return this.inspectingResponse()?.answers.find(a => a.questionId === qId);
  }

  previewVersionQuestions(ver: FeedbackFormVersion) {
    this.inspectingResponse.set({
      responseId: 'preview-only',
      feedbackFormId: ver.feedbackFormId,
      feedbackFormVersionId: ver.versionId,
      versionLabel: ver.versionLabel,
      planId: this.planId(),
      traineeName: 'Version Preview',
      isAnonymous: false,
      answers: [],
      submittedAt: ver.publishedAt || 'Current'
    });
  }

  // --- Builder Methods ---

  openFormBuilder() {
    const cur = this.currentPublishedVersion();
    if (cur) {
      this.builderQuestions.set(JSON.parse(JSON.stringify(cur.questions)));
      this.builderChangeSummary.set(`Updated questions and response options for version v${(this.activeForm()?.versions.length || 1) + 1}`);
    }
    this.showBuilderModal.set(true);
  }

  addQuestion(type: FeedbackQuestionType) {
    const nextOrder = this.builderQuestions().length + 1;
    const newQ: FeedbackQuestion = {
      questionId: `q_cust_${Date.now()}`,
      type,
      text: type === 'text' ? 'What additional feedback do you have for this plan?' : 'Rate your satisfaction with this module:',
      required: true,
      order: nextOrder,
      options: type === 'singleSelect' || type === 'multiSelect' ? [
        { optionId: `opt_${Date.now()}_1`, text: 'Exceeded Expectations' },
        { optionId: `opt_${Date.now()}_2`, text: 'Met Expectations' },
        { optionId: `opt_${Date.now()}_3`, text: 'Needs Improvement' }
      ] : undefined
    };
    this.builderQuestions.update(list => [...list, newQ]);
  }

  removeQuestion(idx: number) {
    this.builderQuestions.update(list => list.filter((_, i) => i !== idx));
  }

  toggleRequired(idx: number) {
    this.builderQuestions.update(list => list.map((q, i) => i === idx ? { ...q, required: !q.required } : q));
  }

  updateQuestionText(idx: number, text: string) {
    this.builderQuestions.update(list => list.map((q, i) => i === idx ? { ...q, text } : q));
  }

  addOption(qIdx: number) {
    this.builderQuestions.update(list => list.map((q, i) => {
      if (i === qIdx) {
        const opts = q.options ? [...q.options] : [];
        opts.push({ optionId: `opt_${Date.now()}_${opts.length + 1}`, text: `New Option ${opts.length + 1}` });
        return { ...q, options: opts };
      }
      return q;
    }));
  }

  removeOption(qIdx: number, optIdx: number) {
    this.builderQuestions.update(list => list.map((q, i) => {
      if (i === qIdx && q.options) {
        return { ...q, options: q.options.filter((_, oi) => oi !== optIdx) };
      }
      return q;
    }));
  }

  updateOptionText(qIdx: number, optIdx: number, text: string) {
    this.builderQuestions.update(list => list.map((q, i) => {
      if (i === qIdx && q.options) {
        const copy = [...q.options];
        copy[optIdx] = { ...copy[optIdx], text };
        return { ...q, options: copy };
      }
      return q;
    }));
  }

  publishNewVersion() {
    const form = this.activeForm();
    if (!form) return;

    this.lmsData.forkNewFeedbackFormVersion(
      form.feedbackFormId,
      this.builderQuestions(),
      this.builderChangeSummary(),
      true
    );

    this.showBuilderModal.set(false);
    this.resetSimulationAnswers();
  }

  // --- Runtime Simulation Handlers ---

  updateTextAnswer(qId: string, text: string) {
    this.simulationAnswers.update(curr => ({
      ...curr,
      [qId]: { ...curr[qId], text }
    }));
  }

  updateSingleSelectAnswer(qId: string, optId: string) {
    this.simulationAnswers.update(curr => ({
      ...curr,
      [qId]: { ...curr[qId], selectedOptionIds: [optId] }
    }));
  }

  isMultiOptionSelected(qId: string, optId: string): boolean {
    return !!this.simulationAnswers()[qId]?.selectedOptionIds?.includes(optId);
  }

  toggleMultiOption(qId: string, optId: string) {
    const existing = this.simulationAnswers()[qId]?.selectedOptionIds || [];
    const updated = existing.includes(optId) 
      ? existing.filter(id => id !== optId) 
      : [...existing, optId];

    this.simulationAnswers.update(curr => ({
      ...curr,
      [qId]: { ...curr[qId], selectedOptionIds: updated }
    }));
  }

  submitTraineeFeedback() {
    const form = this.activeForm();
    const ver = this.currentPublishedVersion();
    if (!form || !ver) return;

    // Validate required questions
    for (const q of ver.questions) {
      if (q.required) {
        const a = this.simulationAnswers()[q.questionId];
        if (!a) {
          this.lmsData.showToast('All mandatory fields are not filled up.', 'warning', 3500, 'Validation Incomplete');
          return;
        }
        if (q.type === 'text' && (!a.text || !a.text.trim())) {
          this.lmsData.showToast('All mandatory fields are not filled up.', 'warning', 3500, 'Validation Incomplete');
          return;
        }
        if ((q.type === 'singleSelect' || q.type === 'multiSelect') && (!a.selectedOptionIds || a.selectedOptionIds.length === 0)) {
          this.lmsData.showToast('All mandatory fields are not filled up.', 'warning', 3500, 'Validation Incomplete');
          return;
        }
      }
    }

    const user = this.lmsData.activeUser();
    const isAnon = this.submissionIsAnonymous();

    const formattedAnswers = Object.entries(this.simulationAnswers()).map(([qId, val]) => ({
      questionId: qId,
      text: val.text || null,
      selectedOptionIds: val.selectedOptionIds || []
    }));

    this.lmsData.submitFeedbackResponse({
      feedbackFormId: form.feedbackFormId,
      feedbackFormVersionId: ver.versionId,
      versionLabel: ver.versionLabel,
      planId: this.planId(),
      planName: form.planName,
      traineeId: isAnon ? undefined : user.id,
      traineeName: isAnon ? undefined : user.name,
      traineeEmail: isAnon ? undefined : user.email,
      traineeAvatar: isAnon ? undefined : user.avatar,
      isAnonymous: isAnon,
      answers: formattedAnswers
    });

    this.resetSimulationAnswers();
    this.activeSubTab.set('responses');
  }
}
