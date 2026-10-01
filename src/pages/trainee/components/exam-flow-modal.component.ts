import { Component, ChangeDetectionStrategy, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanComponent } from '../../../models/plan.model';
import { TraineePlanService } from '../../../services/trainee-plan.service';

interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

@Component({
  selector: 'app-exam-flow-modal',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 !m-0 top-0 left-0 right-0 bottom-0 w-screen h-screen bg-black/80 backdrop-blur-md z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div class="bg-base-100 dark:bg-base-200 border border-base-300 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-modal-card m-auto">

        <!-- Top Header -->
        <div class="p-4 sm:p-5 border-b border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/50 dark:bg-base-300/40">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <span class="material-symbols-outlined text-xl">quiz</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                  {{ component().type }}
                </span>
                <span class="text-xs text-text-secondary">Diagnostic Evaluation</span>
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

        <!-- STAGE 1: EXAM BRIEF / RULES -->
        @if (currentStage() === 'brief') {
          <div class="p-6 overflow-y-auto flex-1 space-y-6">
            <div class="p-5 rounded-2xl bg-base-200/50 dark:bg-base-300/30 border border-base-300 dark:border-slate-800 space-y-4">
              <h3 class="text-sm font-bold text-text-primary flex items-center gap-2">
                <span class="material-symbols-outlined text-tenant-600">info</span>
                Assessment Instructions & Guidelines
              </h3>
              <p class="text-xs text-text-secondary leading-relaxed">
                This evaluation measures your mastery of client protection protocols, lending procedures, and credit verification standards. Once started, the exam will run against a real-time countdown timer.
              </p>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div class="p-3 bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 dark:border-slate-700 text-center">
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Passing Mark</div>
                  <div class="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{{ passMark() }}%</div>
                </div>
                <div class="p-3 bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 dark:border-slate-700 text-center">
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Time Limit</div>
                  <div class="text-base font-black text-text-primary mt-0.5">15 Mins</div>
                </div>
                <div class="p-3 bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 dark:border-slate-700 text-center">
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Questions</div>
                  <div class="text-base font-black text-text-primary mt-0.5">{{ questions.length }} Total</div>
                </div>
                <div class="p-3 bg-base-100 dark:bg-base-200 rounded-xl border border-base-300 dark:border-slate-700 text-center">
                  <div class="text-[10px] uppercase font-bold text-text-secondary">Attempts</div>
                  <div class="text-base font-black text-indigo-600 dark:text-indigo-400 mt-0.5">Unlimited</div>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <span class="material-symbols-outlined text-amber-600 text-base mt-0.5">warning</span>
              <span>Do not refresh or navigate away from this browser window while the exam is in progress. Your answers are auto-saved.</span>
            </div>
          </div>

          <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/40">
            <button 
              type="button" 
              (click)="close.emit()"
              class="px-4 py-2.5 rounded-xl border border-base-300 dark:border-slate-700 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer">
              Cancel
            </button>
            <button 
              type="button" 
              (click)="startExam()"
              class="px-6 py-2.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
              <span>Begin Assessment</span>
              <span class="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        }

        <!-- STAGE 2: IN PROGRESS (QUESTIONS RUNTIME) -->
        @if (currentStage() === 'in_progress') {
          <div class="p-6 overflow-y-auto flex-1 space-y-6">
            
            <!-- Timer & Progress Bar -->
            <div class="flex items-center justify-between pb-3 border-b border-base-300 dark:border-slate-800 text-xs">
              <div class="font-bold text-text-primary">
                Question {{ currentQIndex() + 1 }} of {{ questions.length }}
              </div>
              <div class="flex items-center gap-1.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                <span class="material-symbols-outlined text-base animate-pulse">timer</span>
                <span>{{ formatSeconds(timerSeconds()) }} remaining</span>
              </div>
            </div>

            <!-- Active Question -->
            <div class="space-y-4">
              <h3 class="text-sm sm:text-base font-bold text-text-primary leading-snug">
                {{ activeQuestion().question }}
              </h3>

              <div class="space-y-2.5 pt-2">
                @for (opt of activeQuestion().options; track opt; let optIdx = $index) {
                  <label 
                    (click)="selectOption(optIdx)"
                    [class.border-tenant-500]="selectedAnswers()[currentQIndex()] === optIdx"
                    [class.bg-tenant-50/50]="selectedAnswers()[currentQIndex()] === optIdx"
                    [class.dark:bg-tenant-950/20]="selectedAnswers()[currentQIndex()] === optIdx"
                    [class.border-base-300]="selectedAnswers()[currentQIndex()] !== optIdx"
                    class="p-4 rounded-xl border bg-base-100 dark:bg-base-200 hover:border-tenant-400 transition-all flex items-center gap-3 cursor-pointer text-xs">
                    <input 
                      type="radio" 
                      name="q_opt" 
                      [checked]="selectedAnswers()[currentQIndex()] === optIdx"
                      class="text-tenant-600 focus:ring-tenant-500" />
                    <span class="text-text-primary font-medium">{{ opt }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Question Palette -->
            <div class="pt-4 border-t border-base-300 dark:border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                @for (q of questions; track q.id; let idx = $index) {
                  <button 
                    type="button" 
                    (click)="currentQIndex.set(idx)"
                    [class.bg-tenant-600]="currentQIndex() === idx"
                    [class.text-white]="currentQIndex() === idx"
                    [class.bg-emerald-100]="currentQIndex() !== idx && selectedAnswers()[idx] !== undefined"
                    [class.text-emerald-800]="currentQIndex() !== idx && selectedAnswers()[idx] !== undefined"
                    [class.bg-base-200]="currentQIndex() !== idx && selectedAnswers()[idx] === undefined"
                    class="w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer">
                    {{ idx + 1 }}
                  </button>
                }
              </div>

              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  [disabled]="currentQIndex() <= 0"
                  (click)="prevQuestion()"
                  class="px-3 py-1.5 rounded-lg border border-base-300 dark:border-slate-700 text-xs font-bold disabled:opacity-30 cursor-pointer">
                  Previous
                </button>
                @if (currentQIndex() < questions.length - 1) {
                  <button 
                    type="button" 
                    (click)="nextQuestion()"
                    class="px-3.5 py-1.5 rounded-lg bg-base-200 dark:bg-base-300 text-text-primary text-xs font-bold cursor-pointer">
                    Next
                  </button>
                }
              </div>
            </div>

          </div>

          <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/40">
            <span class="text-xs text-text-secondary">
              Answered: {{ answeredCount() }} / {{ questions.length }}
            </span>
            <button 
              type="button" 
              (click)="finishExam()"
              class="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer">
              <span class="material-symbols-outlined text-base">check_circle</span>
              <span>Submit Assessment</span>
            </button>
          </div>
        }

        <!-- STAGE 3: RESULT -->
        @if (currentStage() === 'result') {
          <div class="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-center">
            
            <div 
              class="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl"
              [class.bg-emerald-100]="hasPassed()"
              [class.text-emerald-600]="hasPassed()"
              [class.bg-rose-100]="!hasPassed()"
              [class.text-rose-600]="!hasPassed()">
              <span class="material-symbols-outlined text-4xl">
                {{ hasPassed() ? 'emoji_events' : 'sentiment_dissatisfied' }}
              </span>
            </div>

            <div class="space-y-1">
              <h3 class="text-xl font-black text-text-primary">
                {{ hasPassed() ? 'Assessment Passed Successfully!' : 'Passing Threshold Not Reached' }}
              </h3>
              <p class="text-xs text-text-secondary max-w-md mx-auto">
                {{ hasPassed() 
                  ? 'Great work! You demonstrated thorough understanding of the required compliance directives and passed the threshold.' 
                  : 'You did not meet the required 80% passing standard. Review the answer explanations below and retry when ready.' }}
              </p>
            </div>

            <!-- Score Cards -->
            <div class="grid grid-cols-2 gap-4 max-w-sm mx-auto pt-2">
              <div class="p-4 rounded-2xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-700">
                <div class="text-[10px] uppercase font-bold text-text-secondary">Your Score</div>
                <div 
                  class="text-2xl font-black mt-1"
                  [class.text-emerald-600]="hasPassed()"
                  [class.text-rose-600]="!hasPassed()">
                  {{ calculatedScore() }}%
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-base-200/60 dark:bg-base-300/40 border border-base-300 dark:border-slate-700">
                <div class="text-[10px] uppercase font-bold text-text-secondary">Required Score</div>
                <div class="text-2xl font-black text-text-primary mt-1">{{ passMark() }}%</div>
              </div>
            </div>

            <!-- Question Review Breakdown -->
            <div class="text-left space-y-3 pt-4 border-t border-base-300 dark:border-slate-800">
              <h4 class="text-xs font-bold uppercase tracking-wider text-text-secondary">Answer Breakdown</h4>
              @for (q of questions; track q.id; let idx = $index) {
                <div class="p-3.5 rounded-xl border border-base-300 dark:border-slate-800 bg-base-100 dark:bg-base-200 text-xs space-y-1.5">
                  <div class="flex items-center justify-between font-bold">
                    <span class="text-text-primary">{{ idx + 1 }}. {{ q.question }}</span>
                    @if (selectedAnswers()[idx] === q.correctIndex) {
                      <span class="text-emerald-600 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">check</span> Correct
                      </span>
                    } @else {
                      <span class="text-rose-600 font-bold flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">close</span> Incorrect
                      </span>
                    }
                  </div>
                  <div class="text-[11px] text-text-secondary">{{ q.explanation }}</div>
                </div>
              }
            </div>

          </div>

          <div class="p-4 sm:p-5 border-t border-base-300 dark:border-slate-800 flex items-center justify-between bg-base-200/40">
            @if (!hasPassed()) {
              <button 
                type="button" 
                (click)="startExam()"
                class="px-5 py-2.5 rounded-xl bg-tenant-600 hover:bg-tenant-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <span class="material-symbols-outlined text-base">replay</span>
                <span>Retake Assessment</span>
              </button>
            } @else {
              <div></div>
            }

            <button 
              type="button" 
              (click)="finishFlow()"
              class="px-5 py-2.5 rounded-xl bg-base-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold cursor-pointer">
              Done & Return
            </button>
          </div>
        }

      </div>
    </div>
  `
})
export class ExamFlowModalComponent {
  component = input.required<PlanComponent>();
  close = output<void>();
  completed = output<void>();

  private traineeService = inject(TraineePlanService);

  currentStage = signal<'brief' | 'in_progress' | 'result'>('brief');
  passMark = signal(80);
  currentQIndex = signal(0);
  selectedAnswers = signal<Record<number, number>>({});
  timerSeconds = signal(900); // 15 mins

  questions: ExamQuestion[] = [
    {
      id: 'q1',
      question: 'What is the standard response if a microfinance client reports an operational grievance during weekly collection?',
      options: [
        'Dismiss the issue if borrower loan repayment is currently on schedule',
        'Log the inquiry into the official Grievance Redressal Mechanism (GRM) ticket system within 24 hours',
        'Instruct the client to contact external media outlets',
        'Confiscate the passbook indefinitely until payment clears'
      ],
      correctIndex: 1,
      explanation: 'All feedback is tracked in BRAC central GRM system with a 72-hour mandatory resolution window.'
    },
    {
      id: 'q2',
      question: 'Under BRAC Client Protection standards, which action is strictly prohibited during field collections?',
      options: [
        'Issuing an electronic receipt via mobile POS',
        'Any form of coercive, abusive, or intimidating recovery practices',
        'Providing financial literacy counseling',
        'Verifying borrower national identity numbers'
      ],
      correctIndex: 1,
      explanation: 'Coercive collection violates fundamental human dignity ethos and leads to immediate disciplinary termination.'
    },
    {
      id: 'q3',
      question: 'How do Field Officers prevent household over-indebtedness before issuing multi-purpose credit?',
      options: [
        'Lending without structured repayment schedules',
        'Conducting comprehensive cash-flow auditing and household debt-to-income analysis',
        'Charging upfront hidden document surcharges',
        'Requiring physical gold or collateral deposit'
      ],
      correctIndex: 1,
      explanation: 'Thorough cash-flow auditing prevents unmanageable debt across family dependents.'
    }
  ];

  activeQuestion = () => this.questions[this.currentQIndex()];

  answeredCount = () => Object.keys(this.selectedAnswers()).length;

  calculatedScore = signal(0);
  hasPassed = signal(false);

  startExam() {
    this.selectedAnswers.set({});
    this.currentQIndex.set(0);
    this.currentStage.set('in_progress');
  }

  prevQuestion() {
    if (this.currentQIndex() > 0) {
      this.currentQIndex.update(i => i - 1);
    }
  }

  nextQuestion() {
    if (this.currentQIndex() < this.questions.length - 1) {
      this.currentQIndex.update(i => i + 1);
    }
  }

  selectOption(optIdx: number) {
    this.selectedAnswers.update(map => ({
      ...map,
      [this.currentQIndex()]: optIdx
    }));
  }

  finishExam() {
    let correct = 0;
    this.questions.forEach((q, idx) => {
      if (this.selectedAnswers()[idx] === q.correctIndex) {
        correct++;
      }
    });

    const score = Math.round((correct / this.questions.length) * 100);
    this.calculatedScore.set(score);
    const passed = score >= this.passMark();
    this.hasPassed.set(passed);

    this.traineeService.submitExamResult(this.component().id, score, 100, this.passMark());
    this.currentStage.set('result');
  }

  finishFlow() {
    if (this.hasPassed()) {
      this.completed.emit();
    }
    this.close.emit();
  }

  formatSeconds(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}
