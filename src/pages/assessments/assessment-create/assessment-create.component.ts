import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  Assessment,
  AssessmentType,
  AssessmentScoringMode,
  AssessmentQuestion,
  AssessmentQuestionOption,
  AssessmentScoringPolicy,
  AssessmentQuestionDifficulty,
  RandomizationMode,
  MatchingPair
} from '../../../models/assessment.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

export type AssessmentWizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'app-assessment-create',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, CustomSelectComponent, StepperComponent],
  templateUrl: './assessment-create.component.html',
  styleUrl: './assessment-create.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentCreateComponent implements OnInit {
  lmsService = inject(LmsDataService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Stepper State
  currentStep = signal<AssessmentWizardStep>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  isEditMode = signal<boolean>(false);
  editingAssessmentId = signal<string | null>(null);

  // Stepper Configuration - Step 2 is now Scoring & Rules, Step 3 is Question Studio
  steps: StepperStep[] = [
    { id: 1, key: 'basic', title: 'Basic Information', shortTitle: 'Basic Info', sublabel: 'Identity & Type', icon: 'school' },
    { id: 2, key: 'scoring', title: 'Scoring & Rules', shortTitle: 'Scoring & Rules', sublabel: 'Benchmarks & Randomization', icon: 'tune' },
    { id: 3, key: 'questions', title: 'Question Studio', shortTitle: 'Question Studio', sublabel: 'Authored Items & Repository', icon: 'quiz' },
    { id: 4, key: 'preview', title: 'Preview & Confirm', shortTitle: 'Preview', sublabel: 'Review & Publish', icon: 'preview' }
  ];

  // Alerts & Validation Messages
  formErrorAlert = signal<string | null>(null);
  successAlert = signal<string | null>(null);

  // =========================================================================
  // STEP 1: Form Model State (Basic Information)
  // =========================================================================
  code = signal<string>(`ASM-${Math.floor(1000 + Math.random() * 9000)}`);
  title = signal<string>('');
  titleTouched = signal<boolean>(false);
  description = signal<string>('');
  type = signal<AssessmentType>('exam');
  scoringMode = signal<AssessmentScoringMode>('scored');
  categoryTagInput = signal<string>('');
  categoryTags = signal<string[]>(['General', 'Compliance']);
  sharingLevel = signal<'private' | 'lms' | 'org'>('lms');

  responsibleInstructorId = signal<string | undefined>(undefined);
  responsibleInstructorName = signal<string | undefined>(undefined);
  instructorTouched = signal<boolean>(false);

  // Hardcoded static Assessment Type options
  typeOptions: SelectOption[] = [
    { value: 'pre-test', label: 'Pre-test Assessment', sublabel: 'Initial diagnostic baseline test before course/topic start', icon: 'flag' },
    { value: 'post-test', label: 'Post-test Assessment', sublabel: 'Summative achievement examination conducted after completion', icon: 'verified' },
    { value: 'exam', label: 'Formal Exam', sublabel: 'High-stakes examination with timed submission', icon: 'military_tech' },
    { value: 'quiz', label: 'Quick Quiz', sublabel: 'Knowledge verification check between phases', icon: 'quiz' },
    { value: 'assignment', label: 'Assignment / Task', sublabel: 'Practical project or file artifact evaluation', icon: 'assignment' },
    { value: 'survey', label: 'Feedback Survey', sublabel: 'Ungraded qualitative learner feedback questionnaire', icon: 'rate_review' },
    { value: 'diagnostic', label: 'Diagnostic Assessment', sublabel: 'Initial skill baseline evaluation test', icon: 'troubleshoot' }
  ];

  scoringModeOptions: SelectOption[] = [
    { value: 'scored', label: 'Point-Scored & Graded', sublabel: 'Calculate numeric marks with customizable pass percentage', icon: 'score' },
    { value: 'passFail', label: 'Pass / Fail Only', sublabel: 'Binary qualification outcome based on minimum benchmark', icon: 'rule' },
    { value: 'rubric', label: 'Rubric-Based Evaluation', sublabel: 'Multi-criteria qualitative rubric evaluation', icon: 'view_list' },
    { value: 'ungraded', label: 'Ungraded / Completion', sublabel: 'Participant completion tracking with no grade recorded', icon: 'check_circle' }
  ];

  sharingLevelOptions: SelectOption[] = [
    { value: 'lms', label: 'Active LMS Instance Only', sublabel: 'Visible only within the current workspace node', icon: 'lock' },
    { value: 'org', label: 'Organization-Wide Repository', sublabel: 'Shared across all LMS branches in this organization', icon: 'corporate_fare' },
    { value: 'private', label: 'Instructor Private Draft', sublabel: 'Restricted solely to authoring instructor', icon: 'person' }
  ];

  // =========================================================================
  // STEP 2: Scoring & Rules State (Including Randomization Suite)
  // =========================================================================
  passMarkPercent = signal<number>(60);
  negativeMarkingEnabled = signal<boolean>(false);
  negativePenalty = signal<number>(0.25);
  allowedAttempts = signal<number>(1);
  keepScoreRule = signal<'highest' | 'latest' | 'average' | 'first'>('highest');
  timeLimitMinutes = signal<number | null>(30);
  showScorePolicy = signal<'afterSubmit' | 'afterGrading' | 'afterWindowClose' | 'never'>('afterSubmit');
  showCorrectAnswers = signal<boolean>(true);
  showFeedback = signal<boolean>(true);

  // Randomization Policy Configuration
  randomizationEnabled = signal<boolean>(false);
  randomizationMode = signal<RandomizationMode>('shuffle'); // 'shuffle' | 'pool_plain' | 'pool_by_difficulty'
  shuffleOptions = signal<boolean>(true);
  poolPlainCount = signal<number>(5);

  // Difficulty-specific quotas for 'pool_by_difficulty'
  difficultyRuleBeginner = signal<number>(2);
  difficultyRuleIntermediate = signal<number>(2);
  difficultyRuleAdvanced = signal<number>(1);
  difficultyRuleExpert = signal<number>(0);

  randomizationModeOptions: SelectOption[] = [
    { 
      value: 'shuffle', 
      label: 'Plain Question Shuffle', 
      sublabel: 'Deliver all authored questions in randomized order for each candidate', 
      icon: 'shuffle' 
    },
    { 
      value: 'pool_plain', 
      label: 'Random Pool Subset', 
      sublabel: 'Draw a fixed number of random questions from the total authored pool', 
      icon: 'casino' 
    },
    { 
      value: 'pool_by_difficulty', 
      label: 'Difficulty-Based Balanced Pool', 
      sublabel: 'Draw controlled quotas per difficulty level (Beginner, Advanced, Expert)', 
      icon: 'stacked_line_chart' 
    }
  ];

  resultDisplayOptions: SelectOption[] = [
    { value: 'afterSubmit', label: 'Immediately After Submission', sublabel: 'Learners see their score and breakdown instantly', icon: 'speed' },
    { value: 'afterGrading', label: 'After Instructor Grading', sublabel: 'Results released once all manual essays are reviewed', icon: 'grading' },
    { value: 'afterWindowClose', label: 'After Assessment Window Closes', sublabel: 'Released to all examinees at the same time', icon: 'event_busy' },
    { value: 'never', label: 'Never Display to Learner', sublabel: 'Results retained only for administrator records', icon: 'visibility_off' }
  ];

  keepScoreOptions: SelectOption[] = [
    { value: 'highest', label: 'Keep Highest Score', sublabel: 'Best attempt across all tries is recorded', icon: 'star' },
    { value: 'latest', label: 'Keep Latest Attempt', sublabel: 'Most recent score replaces earlier scores', icon: 'history' },
    { value: 'average', label: 'Average Score', sublabel: 'Arithmetic mean of all completed attempts', icon: 'calculate' },
    { value: 'first', label: 'First Attempt Only', sublabel: 'Subsequent attempts are for practice only', icon: 'looks_one' }
  ];

  // =========================================================================
  // STEP 3: Questions State & Question Studio
  // =========================================================================
  questions = signal<AssessmentQuestion[]>([]);
  activeQuestionIndex = signal<number | null>(0);
  questionsTouched = signal<boolean>(false);

  // Step 3 Alert & Confirmation States
  step3Alert = signal<{
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action: string;
    timestamp?: number;
  } | null>(null);

  showDeleteQuestionConfirm = signal<boolean>(false);
  questionToDeleteIndex = signal<number | null>(null);
  showResetStep3Confirm = signal<boolean>(false);
  showCancelConfirmModal = signal<boolean>(false);

  // Question Difficulty Options
  difficultyOptions: SelectOption[] = [
    { value: 'beginner', label: 'Beginner', sublabel: 'Foundational concepts, recall & definitions', icon: 'star_outline' },
    { value: 'intermediate', label: 'Intermediate', sublabel: 'Applied procedural knowledge and standard cases', icon: 'star_half' },
    { value: 'advanced', label: 'Advanced', sublabel: 'Complex problem solving and multi-step reasoning', icon: 'star' },
    { value: 'expert', label: 'Expert', sublabel: 'Critical scenario evaluation and edge-case mastery', icon: 'military_tech' }
  ];

  newQuestionTypeOptions: SelectOption[] = [
    { value: 'singleSelect', label: 'Single Choice (MCQ)', sublabel: 'One correct answer among choices', icon: 'radio_button_checked' },
    { value: 'multiSelect', label: 'Multiple Choice (Multi-Select)', sublabel: 'Multiple correct options with partial/full score', icon: 'check_box' },
    { value: 'trueFalse', label: 'True / False', sublabel: 'Binary conceptual verification statement', icon: 'toggle_on' },
    { value: 'matching', label: 'Matching Pairs', sublabel: 'Connect premises with corresponding definitions', icon: 'sync_alt' },
    { value: 'fillBlank', label: 'Fill in the Blank', sublabel: 'Keyword text matching in sentence blanks', icon: 'edit_note' },
    { value: 'ordering', label: 'Sequence Ordering', sublabel: 'Chronological or workflow step arrangement', icon: 'format_list_numbered' },
    { value: 'numeric', label: 'Numeric Target', sublabel: 'Numerical computation with optional tolerance range', icon: 'calculate' },
    { value: 'essay', label: 'Essay / Long Text (Manual)', sublabel: 'Free-form answer evaluated by responsible instructor', icon: 'article' },
    { value: 'fileUpload', label: 'File Upload / Artifact (Manual)', sublabel: 'Trainee uploads document or media artifact', icon: 'upload_file' }
  ];

  // =========================================================================
  // Question Repository Modal State ("Add from Repository")
  // =========================================================================
  showRepositoryModal = signal<boolean>(false);
  repoSearchQuery = signal<string>('');
  repoDifficultyFilter = signal<string>('all');
  repoTypeFilter = signal<string>('all');
  repoCategoryFilter = signal<string>('all');
  selectedRepoQuestionIds = signal<Set<string>>(new Set<string>());

  // Curated Question Bank Items for the Repository
  curatedRepositoryBank: AssessmentQuestion[] = [
    {
      questionId: 'repo-q1',
      type: 'singleSelect',
      text: 'What is the primary role of a Village Organization (VO) Credit Officer during group lending sessions?',
      required: true,
      points: 2,
      difficulty: 'beginner',
      category: 'Microfinance & Field Operations',
      order: 1,
      manualGraded: false,
      options: [
        { optionId: 'r-opt-1', text: 'Facilitating transparent group discussions and recording savings & installment payments', correct: true },
        { optionId: 'r-opt-2', text: 'Confiscating collateral assets immediately upon payment delay', correct: false },
        { optionId: 'r-opt-3', text: 'Setting interest rates independently without central policy approval', correct: false },
        { optionId: 'r-opt-4', text: 'Approving commercial enterprise loans exceeding BDT 1,000,000', correct: false }
      ],
      explanation: 'Field officers maintain transparency, foster peer support, and accurately log transactions.'
    },
    {
      questionId: 'repo-q2',
      type: 'multiSelect',
      text: 'Which mandatory security checks must be performed before logging into the LMS mobile application on field tablets?',
      required: true,
      points: 3,
      difficulty: 'beginner',
      category: 'IT Security & Compliance',
      order: 2,
      manualGraded: false,
      scoringRule: { multiSelect: 'allOrNothing' },
      options: [
        { optionId: 'r-opt-2a', text: 'Verify device encryption is active and OS is updated', correct: true },
        { optionId: 'r-opt-2b', text: 'Ensure biometric or PIN authentication is enabled', correct: true },
        { optionId: 'r-opt-2c', text: 'Disable device location services to conserve battery', correct: false },
        { optionId: 'r-opt-2d', text: 'Confirm secure VPN connection when on public Wi-Fi', correct: true }
      ],
      explanation: 'Standard field IT policy requires encryption, PIN/biometrics, and VPN on untrusted networks.'
    },
    {
      questionId: 'repo-q3',
      type: 'trueFalse',
      text: 'In Ultra-Poor Graduation interventions, asset transfers should precede livelihood training to expedite income generation.',
      required: true,
      points: 2,
      difficulty: 'intermediate',
      category: 'Poverty Graduation Programs',
      order: 3,
      manualGraded: false,
      options: [
        { optionId: 'tf-t', text: 'True', correct: false },
        { optionId: 'tf-f', text: 'False', correct: true }
      ],
      explanation: 'Comprehensive hands-on training must be completed BEFORE asset transfer to ensure asset survival and productivity.'
    },
    {
      questionId: 'repo-q4',
      type: 'matching',
      text: 'Match each disaster risk mitigation strategy with its corresponding operational stage.',
      required: true,
      points: 4,
      difficulty: 'advanced',
      category: 'Disaster Management',
      order: 4,
      manualGraded: false,
      matchingPairs: [
        { leftId: 'd1', leftText: 'Pre-Monsoon Flood Vulnerability Mapping', rightId: 'dr1', rightText: 'Preparedness & Risk Identification' },
        { leftId: 'd2', leftText: 'Emergency Cash Transfer Disbursement', rightId: 'dr2', rightText: 'Immediate Disaster Response' },
        { leftId: 'd3', leftText: 'Asset Replacement & Loan Restructuring', rightId: 'dr3', rightText: 'Post-Disaster Livelihood Recovery' },
        { leftId: 'd4', leftText: 'Early Warning Community Siren Broadcast', rightId: 'dr4', rightText: 'Immediate Threat Alert' }
      ]
    },
    {
      questionId: 'repo-q5',
      type: 'singleSelect',
      text: 'When calculating the Portfolio at Risk (PAR > 30), what is the correct formula applied in microfinance accounting?',
      required: true,
      points: 3,
      difficulty: 'advanced',
      category: 'Financial Risk & Accounting',
      order: 5,
      manualGraded: false,
      options: [
        { optionId: 'par-1', text: '(Total outstanding balance of loans overdue > 30 days) / (Gross Loan Portfolio)', correct: true },
        { optionId: 'par-2', text: '(Overdue installments only) / (Gross Loan Portfolio)', correct: false },
        { optionId: 'par-3', text: '(Total defaulted loans) / (Net Annual Profit)', correct: false },
        { optionId: 'par-4', text: '(Total provisions write-offs) / (Total Savings Deposits)', correct: false }
      ],
      explanation: 'PAR measures the entire outstanding principal balance of all loans that have at least one overdue payment > 30 days.'
    },
    {
      questionId: 'repo-q6',
      type: 'essay',
      text: 'Explain how you would handle an ethics complaint where a field supervisor is suspected of withholding client loan passbooks. Outline investigation steps and remediation protocols.',
      required: true,
      points: 5,
      difficulty: 'expert',
      category: 'Leadership & Compliance',
      order: 6,
      manualGraded: true,
      placeholder: 'Describe whistleblowing intake, independent audit verification, evidence safeguarding, and corrective disciplinary actions...'
    },
    {
      questionId: 'repo-q7',
      type: 'numeric',
      text: 'A borrower takes a microloan of BDT 40,000 at a flat 12.5% annual interest for 1 year. Calculate the total interest amount payable in BDT.',
      required: true,
      points: 3,
      difficulty: 'intermediate',
      category: 'Financial Risk & Accounting',
      order: 7,
      manualGraded: false,
      numericTarget: 5000,
      numericTolerance: 0,
      explanation: 'Total Interest = 40,000 * 0.125 = BDT 5,000.'
    },
    {
      questionId: 'repo-q8',
      type: 'fillBlank',
      text: 'Under international microfinance transparency benchmarks, institutions must adopt the ________ Campaign Client Protection Principles.',
      required: true,
      points: 2,
      difficulty: 'beginner',
      category: 'Microfinance & Field Operations',
      order: 8,
      manualGraded: false,
      acceptableBlanks: ['Smart', 'smart', 'SMART'],
      explanation: 'The Smart Campaign provides international standards for client protection.'
    }
  ];

  // Combined Repository of Questions
  allRepositoryQuestions = computed<AssessmentQuestion[]>(() => {
    const list: AssessmentQuestion[] = [...this.curatedRepositoryBank];
    // Also include questions from existing published/draft assessments in LMS
    this.lmsService.assessments().forEach(asm => {
      asm.versions?.forEach(ver => {
        ver.questions?.forEach(q => {
          if (!list.some(existing => existing.questionId === q.questionId || existing.text === q.text)) {
            list.push({
              ...q,
              difficulty: q.difficulty || 'intermediate',
              category: asm.categoryTags?.[0] || 'Assessment Bank'
            });
          }
        });
      });
    });
    return list;
  });

  // Filtered Repository Questions
  filteredRepositoryQuestions = computed<AssessmentQuestion[]>(() => {
    const search = this.repoSearchQuery().toLowerCase().trim();
    const diff = this.repoDifficultyFilter();
    const type = this.repoTypeFilter();
    const cat = this.repoCategoryFilter();

    return this.allRepositoryQuestions().filter(q => {
      if (search && !q.text?.toLowerCase().includes(search) && !q.category?.toLowerCase().includes(search)) {
        return false;
      }
      if (diff !== 'all' && (q.difficulty || 'intermediate') !== diff) {
        return false;
      }
      if (type !== 'all' && q.type !== type) {
        return false;
      }
      if (cat !== 'all' && q.category !== cat) {
        return false;
      }
      return true;
    });
  });

  repoCategories = computed<string[]>(() => {
    const set = new Set<string>();
    this.allRepositoryQuestions().forEach(q => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  });

  // Active Tenant & Instructors
  activeTenant = computed(() => this.lmsService.activeTenant());
  activeLms = computed(() => this.lmsService.activeLms());

  instructorOptions = computed<SelectOption[]>(() => {
    const list = this.lmsService.instructorsRepo();
    return list.map(inst => ({
      value: inst.id,
      label: inst.name,
      sublabel: `${inst.department || 'Academic'} • ${inst.email || 'Instructor'}`,
      icon: 'person'
    }));
  });

  totalMarks = computed<number>(() => {
    return this.questions().reduce((sum, q) => sum + (q.points || 0), 0);
  });

  hasManualQuestions = computed<boolean>(() => {
    return this.questions().some(q => q.manualGraded);
  });

  // Difficulty breakdown in authored questions
  difficultyDistribution = computed(() => {
    const counts: Record<AssessmentQuestionDifficulty, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0
    };
    this.questions().forEach(q => {
      const diff = q.difficulty || 'intermediate';
      counts[diff] = (counts[diff] || 0) + 1;
    });
    return counts;
  });

  // Check if authored questions satisfy the selected Randomization mode
  randomizationCheck = computed(() => {
    if (!this.randomizationEnabled()) {
      return { valid: true, message: 'Question randomization disabled.' };
    }

    const mode = this.randomizationMode();
    const totalQ = this.questions().length;

    if (mode === 'shuffle') {
      return { valid: true, message: `All ${totalQ} questions will be delivered in randomized order.` };
    }

    if (mode === 'pool_plain') {
      const poolTarget = this.poolPlainCount();
      if (poolTarget <= 0) {
        return { valid: false, message: 'Pool sampling size must be greater than 0.' };
      }
      if (totalQ < poolTarget) {
        return { 
          valid: false, 
          message: `Authored questions (${totalQ}) are fewer than requested random pool size (${poolTarget}). Author or import at least ${poolTarget - totalQ} more questions.` 
        };
      }
      return { valid: true, message: `System will sample ${poolTarget} random questions out of ${totalQ} in pool.` };
    }

    if (mode === 'pool_by_difficulty') {
      const dist = this.difficultyDistribution();
      const reqBeg = this.difficultyRuleBeginner();
      const reqInt = this.difficultyRuleIntermediate();
      const reqAdv = this.difficultyRuleAdvanced();
      const reqExp = this.difficultyRuleExpert();
      const totalReq = reqBeg + reqInt + reqAdv + reqExp;

      if (totalReq <= 0) {
        return { valid: false, message: 'Total required questions across difficulty tiers must be greater than 0.' };
      }

      const issues: string[] = [];
      if (dist.beginner < reqBeg) issues.push(`Beginner: ${dist.beginner}/${reqBeg}`);
      if (dist.intermediate < reqInt) issues.push(`Intermediate: ${dist.intermediate}/${reqInt}`);
      if (dist.advanced < reqAdv) issues.push(`Advanced: ${dist.advanced}/${reqAdv}`);
      if (dist.expert < reqExp) issues.push(`Expert: ${dist.expert}/${reqExp}`);

      if (issues.length > 0) {
        return { 
          valid: false, 
          message: `Insufficient questions in pool for: ${issues.join(', ')}. Add more questions in Question Studio or adjust quotas.` 
        };
      }

      return { valid: true, message: `Balanced pool ready: ${totalReq} questions will be drawn dynamically based on difficulty quotas.` };
    }

    return { valid: true, message: 'Randomization configured.' };
  });

  // Validation Checklist for Governance
  validationChecklist = computed(() => {
    const titleOk = this.title().trim().length >= 3;
    const questionsOk = this.questions().length > 0;
    const pointsOk = this.totalMarks() > 0;
    const manualGraded = this.hasManualQuestions();
    const instructorOk = !manualGraded || (!!this.responsibleInstructorId() && !!this.responsibleInstructorName());
    const passMarkOk = this.passMarkPercent() >= 0 && this.passMarkPercent() <= 100;
    const randomizationOk = this.randomizationCheck().valid;

    const allQuestionsValid = this.questions().every(q => {
      const hasText = !!(q.text || q.prompt)?.trim();
      if (!hasText) return false;
      if (q.type === 'singleSelect' || q.type === 'multiSelect' || q.type === 'trueFalse') {
        const hasOptions = (q.options?.length || 0) >= 2;
        const hasCorrect = q.options?.some(o => o.correct || o.isCorrect);
        return hasOptions && hasCorrect;
      }
      return true;
    });

    const isValid = titleOk && questionsOk && pointsOk && instructorOk && passMarkOk && randomizationOk && allQuestionsValid;

    return {
      titleOk,
      questionsOk,
      pointsOk,
      instructorOk,
      manualGraded,
      passMarkOk,
      randomizationOk,
      allQuestionsValid,
      isValid
    };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editingAssessmentId.set(id);
      this.loadAssessmentData(id);
    } else {
      this.addSampleQuestion();
    }
    this.showStepAlert(1, 'entered');
  }

  loadAssessmentData(id: string): void {
    const asm = this.lmsService.assessments().find(a => a.assessmentId === id);
    if (!asm) return;

    this.code.set(asm.code);
    this.title.set(asm.title);
    this.description.set(asm.description || '');
    this.type.set(asm.type);
    this.scoringMode.set(asm.scoringMode);
    this.categoryTags.set(asm.categoryTags || ['General']);
    this.sharingLevel.set(asm.sharingLevel || 'lms');
    this.responsibleInstructorId.set(asm.responsibleInstructorId);
    this.responsibleInstructorName.set(asm.responsibleInstructorName);

    const version = asm.versions.find(v => v.versionId === asm.currentVersionId) || asm.versions[0];
    if (version) {
      this.questions.set(JSON.parse(JSON.stringify(version.questions)));
      const sp = version.scoringPolicy;
      if (sp) {
        this.passMarkPercent.set(sp.passMarkPercent);
        this.negativeMarkingEnabled.set(sp.negativeMarking.enabled);
        this.negativePenalty.set(sp.negativeMarking.penalty);
        this.allowedAttempts.set(sp.attempts.allowed);
        this.keepScoreRule.set(sp.attempts.keep);
        this.timeLimitMinutes.set(sp.timeLimitMinutes);
        this.showScorePolicy.set(sp.resultDisplay.showScore);
        this.showCorrectAnswers.set(sp.resultDisplay.showCorrect);
        this.showFeedback.set(sp.resultDisplay.showFeedback);

        if (sp.randomization) {
          this.randomizationEnabled.set(sp.randomization.enabled);
          this.randomizationMode.set(sp.randomization.mode || 'shuffle');
          this.shuffleOptions.set(sp.randomization.shuffleOptions ?? true);
          if (sp.randomization.poolSize) {
            this.poolPlainCount.set(sp.randomization.poolSize);
          }
          if (sp.randomization.difficultyRules) {
            sp.randomization.difficultyRules.forEach(r => {
              if (r.difficulty === 'beginner') this.difficultyRuleBeginner.set(r.count);
              if (r.difficulty === 'intermediate') this.difficultyRuleIntermediate.set(r.count);
              if (r.difficulty === 'advanced') this.difficultyRuleAdvanced.set(r.count);
              if (r.difficulty === 'expert') this.difficultyRuleExpert.set(r.count);
            });
          }
        }
      }
    }
  }

  onInstructorChange(instId: string): void {
    const inst = this.lmsService.instructorsRepo().find(i => i.id === instId);
    if (inst) {
      this.responsibleInstructorId.set(inst.id);
      this.responsibleInstructorName.set(inst.name);
    } else {
      this.responsibleInstructorId.set(undefined);
      this.responsibleInstructorName.set(undefined);
    }
    this.instructorTouched.set(true);
  }

  // Category Tag handlers
  addCategoryTag(): void {
    const tag = this.categoryTagInput().trim();
    if (tag && !this.categoryTags().includes(tag)) {
      this.categoryTags.update(tags => [...tags, tag]);
      this.categoryTagInput.set('');
    }
  }

  removeCategoryTag(tag: string): void {
    this.categoryTags.update(tags => tags.filter(t => t !== tag));
  }

  // Step 3 Alert Helper & Labels (Question Studio is Step 3)
  triggerStep3Alert(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', action: string = 'Question Studio'): void {
    if (this.currentStep() !== 3) {
      return;
    }
    this.step3Alert.set({
      message,
      type,
      action,
      timestamp: Date.now()
    });
    this.lmsService.showToast(message, type, 3500, action, 'STEP 3 / 4');
  }

  getQuestionTypeLabel(type: string): string {
    switch (type) {
      case 'singleSelect': return 'Single Choice';
      case 'multiSelect': return 'Multi-Select';
      case 'trueFalse': return 'True/False';
      case 'matching': return 'Matching';
      case 'numeric': return 'Numeric';
      case 'essay': return 'Essay';
      case 'fillBlank': return 'Fill-in-Blank';
      case 'ordering': return 'Sequence Ordering';
      case 'fileUpload': return 'File Upload';
      default: return type;
    }
  }

  getDifficultyLabel(difficulty?: AssessmentQuestionDifficulty): string {
    switch (difficulty) {
      case 'beginner': return 'Beginner';
      case 'intermediate': return 'Intermediate';
      case 'advanced': return 'Advanced';
      case 'expert': return 'Expert';
      default: return 'Intermediate';
    }
  }

  getDifficultyBadgeClass(difficulty?: AssessmentQuestionDifficulty): string {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'intermediate':
        return 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'advanced':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'expert':
        return 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-base-200 text-text-secondary border-base-300';
    }
  }

  // Question Management Methods
  addQuestion(type: any, difficulty: AssessmentQuestionDifficulty = 'intermediate'): void {
    const newId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const isManual = type === 'essay' || type === 'fileUpload' || type === 'text';

    const newQ: AssessmentQuestion = {
      questionId: newId,
      type,
      text: `Enter ${this.getQuestionTypeLabel(type)} question instructions...`,
      prompt: `Enter ${this.getQuestionTypeLabel(type)} question instructions...`,
      order: this.questions().length + 1,
      points: isManual ? 5 : 2,
      difficulty,
      required: true,
      manualGraded: isManual,
      explanation: '',
      options:
        type === 'singleSelect' || type === 'multiSelect'
          ? [
              { optionId: `opt-${newId}-1`, text: 'Primary Option A', correct: true, isCorrect: true },
              { optionId: `opt-${newId}-2`, text: 'Alternative Option B', correct: false, isCorrect: false },
              { optionId: `opt-${newId}-3`, text: 'Alternative Option C', correct: false, isCorrect: false }
            ]
          : type === 'trueFalse'
          ? [
              { optionId: `opt-${newId}-t`, text: 'True', correct: true, isCorrect: true },
              { optionId: `opt-${newId}-f`, text: 'False', correct: false, isCorrect: false }
            ]
          : undefined,
      multiSelectScoring: type === 'multiSelect' ? 'allOrNothing' : undefined,
      numericTarget: type === 'numeric' ? 100 : undefined,
      numericTolerance: type === 'numeric' ? 0 : undefined,
      matchingPairs:
        type === 'matching'
          ? [
              { leftId: 'l1', leftText: 'Operational Concept A', rightId: 'r1', rightText: 'Protocol Definition 1', pairId: `mp-1`, leftItem: 'Operational Concept A', rightItem: 'Protocol Definition 1' },
              { leftId: 'l2', leftText: 'Operational Concept B', rightId: 'r2', rightText: 'Protocol Definition 2', pairId: `mp-2`, leftItem: 'Operational Concept B', rightItem: 'Protocol Definition 2' }
            ]
          : undefined,
      orderingItems: type === 'ordering' ? ['Phase 1: Discovery & Planning', 'Phase 2: Execution & Deployment', 'Phase 3: SOC-2 Audit Verification'] : undefined,
      acceptableBlanks: type === 'fillBlank' ? ['governance'] : undefined
    };

    this.questions.update(prev => [...prev, newQ]);
    const newIdx = this.questions().length - 1;
    this.activeQuestionIndex.set(newIdx);

    this.triggerStep3Alert(
      `Added new ${this.getDifficultyLabel(difficulty)} ${this.getQuestionTypeLabel(type)} question (#${newIdx + 1}).`,
      'success',
      'Question Added'
    );
  }

  updateQuestionDifficulty(qIndex: number, difficulty: AssessmentQuestionDifficulty): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return { ...item, difficulty };
      })
    );
    this.triggerStep3Alert(
      `Updated Question #${qIndex + 1} difficulty to "${this.getDifficultyLabel(difficulty)}".`,
      'info',
      'Difficulty Updated'
    );
  }

  addSampleQuestion(): void {
    const newId = `q-${Date.now()}`;
    const newQ: AssessmentQuestion = {
      questionId: newId,
      type: 'singleSelect',
      text: 'What is the primary architectural benefit of a multi-tenant cloud LMS?',
      prompt: 'What is the primary architectural benefit of a multi-tenant cloud LMS?',
      order: 1,
      points: 2,
      difficulty: 'beginner',
      required: true,
      manualGraded: false,
      explanation: 'Multi-tenant architecture achieves operational scale through shared runtime infrastructure combined with logical data separation.',
      options: [
        { optionId: `opt-${newId}-1`, text: 'Resource isolation with shared compute infrastructure', correct: true, isCorrect: true },
        { optionId: `opt-${newId}-2`, text: 'Separate physical servers for every student profile', correct: false, isCorrect: false },
        { optionId: `opt-${newId}-3`, text: 'Elimination of all network security governance requirements', correct: false, isCorrect: false },
        { optionId: `opt-${newId}-4`, text: 'Unrestricted database write access for end learners', correct: false, isCorrect: false }
      ]
    };
    this.questions.set([newQ]);
    this.activeQuestionIndex.set(0);
  }

  promptDeleteQuestion(index: number): void {
    this.questionToDeleteIndex.set(index);
    this.showDeleteQuestionConfirm.set(true);
  }

  deleteQuestion(index: number): void {
    this.promptDeleteQuestion(index);
  }

  confirmDeleteQuestion(): void {
    const index = this.questionToDeleteIndex();
    if (index !== null && index >= 0 && index < this.questions().length) {
      const qNum = index + 1;
      this.questions.update(prev => prev.filter((_, i) => i !== index));
      if (this.activeQuestionIndex() === index) {
        this.activeQuestionIndex.set(Math.max(0, this.questions().length - 1));
      }
      this.showDeleteQuestionConfirm.set(false);
      this.questionToDeleteIndex.set(null);
      this.triggerStep3Alert(
        `Question #${qNum} was deleted from the assessment.`,
        'warning',
        'Question Deleted'
      );
    }
  }

  cancelDeleteQuestion(): void {
    this.showDeleteQuestionConfirm.set(false);
    this.questionToDeleteIndex.set(null);
  }

  duplicateQuestion(index: number): void {
    const source = this.questions()[index];
    if (!source) return;

    const dup: AssessmentQuestion = JSON.parse(JSON.stringify(source));
    dup.questionId = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    this.questions.update(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, dup);
      return copy;
    });
    this.activeQuestionIndex.set(index + 1);
    this.triggerStep3Alert(
      `Question #${index + 1} duplicated as Question #${index + 2}.`,
      'success',
      'Question Duplicated'
    );
  }

  moveQuestion(index: number, direction: 'up' | 'down'): void {
    const list = [...this.questions()];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    this.questions.set(list);
    this.activeQuestionIndex.set(targetIdx);
    this.triggerStep3Alert(
      `Question #${index + 1} moved ${direction} to position #${targetIdx + 1}.`,
      'info',
      'Question Reordered'
    );
  }

  addOption(qIndex: number): void {
    const q = this.questions()[qIndex];
    if (!q || !q.options) return;

    const optId = `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const optLetter = String.fromCharCode(65 + q.options.length);
    const newOpt: AssessmentQuestionOption = {
      optionId: optId,
      text: `Option ${optLetter}`,
      correct: false,
      isCorrect: false
    };

    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: [...(item.options || []), newOpt]
        };
      })
    );
    this.triggerStep3Alert(
      `Added Option ${optLetter} to Question #${qIndex + 1}.`,
      'info',
      'Option Added'
    );
  }

  removeOption(qIndex: number, optIndex: number): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).filter((_, oIdx) => oIdx !== optIndex)
        };
      })
    );
    this.triggerStep3Alert(
      `Removed choice Option #${optIndex + 1} from Question #${qIndex + 1}.`,
      'warning',
      'Option Removed'
    );
  }

  toggleSingleSelectCorrect(qIndex: number, selectedOptId: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).map(opt => ({
            ...opt,
            correct: opt.optionId === selectedOptId,
            isCorrect: opt.optionId === selectedOptId
          }))
        };
      })
    );
    this.triggerStep3Alert(
      `Updated correct answer choice for Question #${qIndex + 1}.`,
      'success',
      'Answer Key Updated'
    );
  }

  toggleMultiSelectCorrect(qIndex: number, optId: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          options: (item.options || []).map(opt => {
            if (opt.optionId === optId) {
              const val = !opt.correct && !opt.isCorrect;
              return { ...opt, correct: val, isCorrect: val };
            }
            return opt;
          })
        };
      })
    );
    this.triggerStep3Alert(
      `Updated multi-select scoring key for Question #${qIndex + 1}.`,
      'info',
      'Answer Key Updated'
    );
  }

  addMatchingPair(qIndex: number): void {
    const pairId = `mp-${Date.now()}`;
    const newPair = { leftId: pairId, leftText: 'New Concept', rightId: pairId, rightText: 'Target Meaning', pairId, leftItem: 'New Concept', rightItem: 'Target Meaning' };
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          matchingPairs: [...(item.matchingPairs || []), newPair]
        };
      })
    );
    this.triggerStep3Alert(
      `Added new matching pair to Question #${qIndex + 1}.`,
      'info',
      'Matching Pair Added'
    );
  }

  removeMatchingPair(qIndex: number, pairIndex: number): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return {
          ...item,
          matchingPairs: (item.matchingPairs || []).filter((_, pIdx) => pIdx !== pairIndex)
        };
      })
    );
    this.triggerStep3Alert(
      `Removed matching pair #${pairIndex + 1} from Question #${qIndex + 1}.`,
      'warning',
      'Matching Pair Removed'
    );
  }

  updateQuestionPrompt(qIndex: number, text: string): void {
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return { ...item, text, prompt: text };
      })
    );
  }

  onQuestionPromptBlur(qIndex: number): void {
    const q = this.questions()[qIndex];
    if (!q) return;
    if (!(q.text || q.prompt)?.trim()) {
      this.triggerStep3Alert(
        `Validation Warning: Question #${qIndex + 1} prompt cannot be empty.`,
        'warning',
        'Prompt Required'
      );
    } else {
      this.triggerStep3Alert(
        `Question #${qIndex + 1} prompt updated.`,
        'info',
        'Prompt Saved'
      );
    }
  }

  updateQuestionPoints(qIndex: number, points: number): void {
    const pts = Math.max(1, Number(points) || 1);
    this.questions.update(prev =>
      prev.map((item, idx) => {
        if (idx !== qIndex) return item;
        return { ...item, points: pts };
      })
    );
    this.triggerStep3Alert(
      `Updated Question #${qIndex + 1} point weight to ${pts} pts (Total: ${this.totalMarks()} pts).`,
      'info',
      'Points Updated'
    );
  }

  promptResetStep3(): void {
    this.showResetStep3Confirm.set(true);
  }

  confirmResetStep3(): void {
    this.questions.set([]);
    this.addSampleQuestion();
    this.showResetStep3Confirm.set(false);
    this.triggerStep3Alert(
      'Question Studio has been reset to default initial state.',
      'warning',
      'Step 3 Reset'
    );
  }

  cancelResetStep3(): void {
    this.showResetStep3Confirm.set(false);
  }

  // =========================================================================
  // Question Repository Actions
  // =========================================================================
  openRepositoryModal(): void {
    this.selectedRepoQuestionIds.set(new Set<string>());
    this.showRepositoryModal.set(true);
  }

  closeRepositoryModal(): void {
    this.showRepositoryModal.set(false);
  }

  toggleSelectRepoQuestion(qId: string): void {
    this.selectedRepoQuestionIds.update(set => {
      const next = new Set(set);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  }

  isRepoQuestionSelected(qId: string): boolean {
    return this.selectedRepoQuestionIds().has(qId);
  }

  selectAllRepoQuestions(): void {
    const ids = this.filteredRepositoryQuestions().map(q => q.questionId);
    this.selectedRepoQuestionIds.set(new Set(ids));
  }

  deselectAllRepoQuestions(): void {
    this.selectedRepoQuestionIds.set(new Set<string>());
  }

  importSelectedQuestions(): void {
    const selectedIds = this.selectedRepoQuestionIds();
    if (selectedIds.size === 0) return;

    const toImport = this.allRepositoryQuestions().filter(q => selectedIds.has(q.questionId));
    
    const clonedQuestions: AssessmentQuestion[] = toImport.map((q, idx) => {
      const copy: AssessmentQuestion = JSON.parse(JSON.stringify(q));
      copy.questionId = `imported-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
      copy.order = this.questions().length + idx + 1;
      return copy;
    });

    this.questions.update(prev => [...prev, ...clonedQuestions]);
    this.showRepositoryModal.set(false);
    this.triggerStep3Alert(
      `Successfully imported ${clonedQuestions.length} questions from Repository into Question Studio.`,
      'success',
      'Repository Import Complete'
    );
    this.lmsService.showToast(
      `Imported ${clonedQuestions.length} questions from Question Bank.`,
      'success',
      4000,
      'Repository Import'
    );
  }

  importSingleQuestion(q: AssessmentQuestion): void {
    const copy: AssessmentQuestion = JSON.parse(JSON.stringify(q));
    copy.questionId = `imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    copy.order = this.questions().length + 1;

    this.questions.update(prev => [...prev, copy]);
    this.triggerStep3Alert(
      `Imported "${q.text.substring(0, 45)}..." from Repository.`,
      'success',
      'Question Imported'
    );
  }

  // =========================================================================
  // Stepper & Wizard Navigation
  // =========================================================================
  jumpToStep(step: number): void {
    if (step < 1 || step > 4) return;
    this.currentStep.set(step as AssessmentWizardStep);
    this.showStepAlert(step as AssessmentWizardStep, 'jump');
    this.scrollTop();
  }

  onNext(): void {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      this.titleTouched.set(true);
      this.instructorTouched.set(true);

      if (!this.title().trim()) {
        this.formErrorAlert.set('Assessment Title is required.');
        this.lmsService.showToast('Validation Error: Please specify an Assessment Title.', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        this.scrollToFirstError();
        return;
      }

      if (this.title().trim().length < 3) {
        this.formErrorAlert.set('Assessment Title must be at least 3 characters.');
        this.lmsService.showToast('Validation Error: Title is too short (min 3 chars).', 'error', 4500, 'Step 1 Error', 'STEP 1 / 4');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(1);
        return next;
      });

      // Move to Step 2: Scoring & Rules
      this.currentStep.set(2);
      this.showStepAlert(2, 'completed');
      this.scrollTop();
    } else if (step === 2) {
      // Validating Step 2: Scoring & Rules
      if (this.passMarkPercent() < 0 || this.passMarkPercent() > 100) {
        this.formErrorAlert.set('Pass mark must be between 0% and 100%.');
        this.lmsService.showToast('Validation Error: Invalid pass mark percentage.', 'error', 4500, 'Step 2 Error', 'STEP 2 / 4');
        this.scrollToFirstError();
        return;
      }

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(2);
        return next;
      });

      // Move to Step 3: Question Studio
      this.currentStep.set(3);
      this.showStepAlert(3, 'completed');
      this.scrollTop();
    } else if (step === 3) {
      // Validating Step 3: Question Studio
      this.questionsTouched.set(true);

      if (this.questions().length === 0) {
        this.formErrorAlert.set('At least one question is required in the Question Studio.');
        this.triggerStep3Alert('Validation Error: Please author or import at least 1 question before proceeding.', 'error', 'Validation Error');
        this.scrollToFirstError();
        return;
      }

      const blankQ = this.questions().find(q => !q.text?.trim() && !q.prompt?.trim());
      if (blankQ) {
        this.formErrorAlert.set('All authored questions must include a question prompt/text.');
        this.triggerStep3Alert('Validation Error: All questions must have a non-empty question prompt.', 'error', 'Validation Error');
        this.scrollToFirstError();
        return;
      }

      const unkeyedMCQ = this.questions().find(q =>
        (q.type === 'singleSelect' || q.type === 'multiSelect' || q.type === 'trueFalse') &&
        !q.options?.some(o => o.correct || o.isCorrect)
      );
      if (unkeyedMCQ) {
        this.formErrorAlert.set('Multiple choice questions must have at least one correct answer selected.');
        this.triggerStep3Alert('Validation Error: Select the correct answer for all choice questions.', 'error', 'Validation Error');
        this.scrollToFirstError();
        return;
      }

      // Check Randomization Rules vs authored question distribution
      const randCheck = this.randomizationCheck();
      if (!randCheck.valid) {
        this.formErrorAlert.set(randCheck.message);
        this.triggerStep3Alert(randCheck.message, 'warning', 'Randomization Quota');
        this.scrollToFirstError();
        return;
      }

      this.triggerStep3Alert('Question Studio completed with all questions validated.', 'success', 'Step 3 Completed');

      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(3);
        return next;
      });

      // Move to Step 4: Preview & Confirm
      this.currentStep.set(4);
      this.showStepAlert(4, 'completed');
      this.scrollTop();
    }
  }

  onPrev(): void {
    const step = this.currentStep();
    if (step > 1) {
      const prevStep = (step - 1) as AssessmentWizardStep;
      this.currentStep.set(prevStep);
      this.showStepAlert(prevStep, 'back');
      this.scrollTop();
    }
  }

  private showStepAlert(step: AssessmentWizardStep, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<AssessmentWizardStep, string> = {
      1: 'Step 1 of 4: Basic Information',
      2: 'Step 2 of 4: Scoring & Rules',
      3: 'Step 3 of 4: Question Studio',
      4: 'Step 4 of 4: Preview & Confirm'
    };

    const actionText: Record<string, string> = {
      entered: 'Active Step Loaded',
      completed: 'Step Completed & Progress Saved',
      back: 'Navigated to Previous Step',
      jump: 'Switched Step View'
    };

    this.lmsService.showToast(
      `${actionText[action]}: ${stepTitles[step]}`,
      'info',
      2500,
      `Step ${step} / 4`,
      `STEP ${step}`
    );
  }

  onCancel(): void {
    if (this.currentStep() === 3 && this.questions().length > 0) {
      this.showCancelConfirmModal.set(true);
    } else {
      this.router.navigate(['/assessments']);
    }
  }

  confirmCancel(): void {
    this.showCancelConfirmModal.set(false);
    this.router.navigate(['/assessments']);
  }

  cancelCloseConfirmModal(): void {
    this.showCancelConfirmModal.set(false);
  }

  onSaveAsDraft(): void {
    this.saveAsDraft();
  }

  private buildScoringPolicy(): AssessmentScoringPolicy {
    return {
      totalMarks: this.totalMarks(),
      passMarkPercent: this.passMarkPercent(),
      negativeMarking: {
        enabled: this.negativeMarkingEnabled(),
        penalty: this.negativePenalty()
      },
      attempts: {
        allowed: this.allowedAttempts(),
        keep: this.keepScoreRule()
      },
      timeLimitMinutes: this.timeLimitMinutes(),
      availability: { opensAt: null, closesAt: null },
      resultDisplay: {
        showScore: this.showScorePolicy(),
        showCorrect: this.showCorrectAnswers(),
        showFeedback: this.showFeedback()
      },
      randomization: {
        enabled: this.randomizationEnabled(),
        mode: this.randomizationMode(),
        poolSize: this.poolPlainCount(),
        shuffleOptions: this.shuffleOptions(),
        difficultyRules: [
          { difficulty: 'beginner', count: this.difficultyRuleBeginner() },
          { difficulty: 'intermediate', count: this.difficultyRuleIntermediate() },
          { difficulty: 'advanced', count: this.difficultyRuleAdvanced() },
          { difficulty: 'expert', count: this.difficultyRuleExpert() }
        ]
      }
    };
  }

  saveAsDraft(): void {
    const scoringPolicy = this.buildScoringPolicy();

    if (this.isEditMode() && this.editingAssessmentId()) {
      const asmId = this.editingAssessmentId()!;
      this.lmsService.updateAssessment(asmId, {
        title: this.title() || 'Untitled Draft Assessment',
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: asmId,
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      this.lmsService.showToast(`Assessment draft "${this.title() || this.code()}" saved successfully.`, 'success', 4500, 'Draft Saved', 'DRAFT');
    } else {
      this.lmsService.createAssessment({
        code: this.code(),
        title: this.title() || 'Untitled Draft Assessment',
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: '',
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      this.lmsService.showToast(`New assessment draft created and saved to repository.`, 'success', 4500, 'Draft Saved', 'DRAFT');
    }

    this.router.navigate(['/assessments']);
  }

  publishNow(): void {
    if (!this.validationChecklist().isValid) {
      this.formErrorAlert.set('Cannot publish: Governance quality gates failed. Please review mandatory items.');
      this.lmsService.showToast('Publish Failed: Governance quality gates failed.', 'error', 5000, 'Publish Error');
      this.scrollToFirstError();
      return;
    }

    let targetId = this.editingAssessmentId();
    const scoringPolicy = this.buildScoringPolicy();

    if (this.isEditMode() && targetId) {
      this.lmsService.updateAssessment(targetId, {
        title: this.title(),
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: targetId,
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
    } else {
      const created = this.lmsService.createAssessment({
        code: this.code(),
        title: this.title(),
        description: this.description(),
        type: this.type(),
        scoringMode: this.scoringMode(),
        categoryTags: this.categoryTags(),
        sharingLevel: this.sharingLevel(),
        responsibleInstructorId: this.responsibleInstructorId(),
        responsibleInstructorName: this.responsibleInstructorName(),
        status: 'draft',
        versions: [
          {
            versionId: `asm-ver-${Date.now()}`,
            assessmentId: '',
            versionLabel: 'v1',
            state: 'draft',
            responseCount: 0,
            questions: this.questions(),
            scoringPolicy
          }
        ]
      });
      targetId = created.assessmentId;
    }

    const res = this.lmsService.publishAssessment(targetId, 'Published via Assessment Wizard');
    if (res.success) {
      this.lmsService.showToast(`Assessment "${this.title()}" is now published and live!`, 'success', 5000, 'Assessment Published', 'LIVE');
      this.router.navigate(['/assessments']);
    } else {
      this.formErrorAlert.set(res.message || 'Publish blocker encountered.');
      this.lmsService.showToast(res.message || 'Publish blocker encountered.', 'error', 5000, 'Publish Error');
    }
  }

  private scrollTop(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private scrollToFirstError(): void {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        '#form-error-banner, input.ng-invalid, select.ng-invalid, textarea.ng-invalid, .border-rose-500, [data-error="true"], .text-rose-500:not(:empty)'
      );
      if (errorEl) {
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if ((errorEl as HTMLElement).focus && typeof (errorEl as HTMLElement).focus === 'function') {
          (errorEl as HTMLElement).focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 60);
  }
}
