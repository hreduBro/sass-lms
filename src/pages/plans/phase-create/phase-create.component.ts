import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import { 
  Plan, 
  Phase, 
  PlanOwner, 
  parseDateDDMMYYYY, 
  formatDateDDMMYYYY 
} from '../../../models/plan.model';
import { Course } from '../../../models/lms.model';
import {
  PhaseTask,
  PhaseDeliverySession,
  PhasePrerequisiteConfig,
  PhaseTraineeAssignment,
  PhaseOutputCredentials,
  AssignedCourseItem,
  DeliveryMode,
  PrerequisiteType,
  TaskStatus,
  TranscriptReleaseRule,
  TraineeAssignmentMode,
  validatePhaseDates
} from '../../../models/phase.model';
import { StepperComponent, StepItem } from '../../../components/stepper/stepper.component';
import { CustomAvatarComponent } from '../../../components/custom-avatar/custom-avatar.component';
import { ConfirmationModalService } from '../../../services/confirmation-modal.service';

@Component({
  selector: 'app-phase-create',
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    RouterModule, 
    StepperComponent,
    CustomAvatarComponent
  ],
  templateUrl: './phase-create.component.html',
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-step-in {
      animation: fadeIn 0.25s ease-out forwards;
    }
  `]
})
export class PhaseCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  lms = inject(LmsDataService);
  modalService = inject(ConfirmationModalService);

  // Parent Plan context (Fixed throughout the flow §0, §1.2)
  parentPlanId = signal<string>('');
  parentPlan = computed<Plan | null>(() => {
    const id = this.parentPlanId();
    if (!id) return null;
    return this.lms.getPlan(id) || null;
  });

  // Sibling phases in the parent plan
  siblingPhases = computed<Phase[]>(() => {
    const plan = this.parentPlan();
    return plan?.phases || [];
  });

  // Edit Mode state
  isEditMode = signal<boolean>(false);
  editingPhaseId = signal<string | null>(null);

  // Stepper State (8 Steps per OneLMS Spec §2)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set<number>());

  steps: StepItem[] = [
    { id: 1, key: 'basic', title: 'Basic Information', shortTitle: 'Basic Info', sublabel: 'Identity & Bounds', icon: 'info' },
    { id: 2, key: 'courses', title: 'Course Assignment', shortTitle: 'Courses', sublabel: 'Curriculum & Owners', icon: 'school' },
    { id: 3, key: 'prerequisites', title: 'Prerequisites & Access Rules', shortTitle: 'Prerequisites', sublabel: 'Gates & Conditions', icon: 'lock_open' },
    { id: 4, key: 'tasks', title: 'Operational Tasks', shortTitle: 'Tasks', sublabel: 'Action Items & Gates', icon: 'task_alt' },
    { id: 5, key: 'delivery', title: 'Delivery Methodology & Classes', shortTitle: 'Delivery', sublabel: 'Sessions & Venues', icon: 'co_present' },
    { id: 6, key: 'trainees', title: 'Trainee / Batch Assignment', shortTitle: 'Trainees', sublabel: 'Cohorts & Learners', icon: 'groups' },
    { id: 7, key: 'outputs', title: 'Certificate, Badge & Transcript', shortTitle: 'Outputs', sublabel: 'Credentials & Rules', icon: 'workspace_premium' },
    { id: 8, key: 'review', title: 'Review & Save Phase', shortTitle: 'Preview', sublabel: 'Validate & Commit', icon: 'rate_review' }
  ];

  // =========================================================================
  // STEP 1: Basic Information State (PHASE-02)
  // =========================================================================
  phaseName = signal<string>('');
  phaseDescription = signal<string>('');
  phaseSequence = signal<number>(1);
  startDate = signal<string>('');
  endDate = signal<string>('');
  phaseOwner = signal<PlanOwner>({
    name: '',
    email: '',
    contactNumber: '',
    invitationStatus: 'accepted'
  });

  updatePhaseOwnerName(name: string) {
    this.phaseOwner.update(o => ({ ...o, name }));
  }

  updatePhaseOwnerEmail(email: string) {
    this.phaseOwner.update(o => ({ ...o, email }));
  }

  // =========================================================================
  // STEP 2: Course Assignment State (PHASE-03)
  // =========================================================================
  courseSearchQuery = signal<string>('');
  selectedCourseCategory = signal<string>('All');
  assignedCoursesList = signal<AssignedCourseItem[]>([]);

  // Courses from LMS library
  allAvailableCourses = computed(() => this.lms.courses());

  // Courses already assigned in sibling phases (to enforce unique course per phase rule §4.1)
  coursesInSiblingPhases = computed(() => {
    const siblings = this.siblingPhases();
    const editingId = this.editingPhaseId();
    const map = new Map<string, string>(); // courseId -> sibling phase name
    siblings.forEach(ph => {
      if (ph.id !== editingId && ph.assignedCourses) {
        ph.assignedCourses.forEach(cId => {
          map.set(cId, ph.name);
        });
      }
    });
    return map;
  });

  filteredLibraryCourses = computed(() => {
    const q = this.courseSearchQuery().trim().toLowerCase();
    const cat = this.selectedCourseCategory();
    let list = this.allAvailableCourses();

    if (cat !== 'All') {
      list = list.filter(c => c.category === cat);
    }
    if (q) {
      list = list.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.category.toLowerCase().includes(q) ||
        (c.instructorName && c.instructorName.toLowerCase().includes(q))
      );
    }
    return list;
  });

  // =========================================================================
  // STEP 3: Prerequisites & Access Rules State (PHASE-04)
  // =========================================================================
  prerequisiteType = signal<PrerequisiteType>('Previous Phase Completion');
  requiredPriorPhaseId = signal<string>('');
  requiredCourseId = signal<string>('');
  minScoreThreshold = signal<number>(75);
  gatedByPendingTasks = signal<boolean>(false);
  unlockDelayDays = signal<number>(0);

  // =========================================================================
  // STEP 4: Tasks State & Modal (PHASE-05)
  // =========================================================================
  tasksList = signal<PhaseTask[]>([]);
  showTaskModal = signal<boolean>(false);
  editingTaskId = signal<string | null>(null);
  newTaskName = signal<string>('');
  newTaskDescription = signal<string>('');
  newTaskAssignedTo = signal<string>('');
  newTaskDueDate = signal<string>('');
  newTaskStatus = signal<TaskStatus>('Pending');
  newTaskIsRequired = signal<boolean>(false);

  // =========================================================================
  // STEP 5: Delivery Methodology & Scheduled Sessions Modal (PHASE-06)
  // =========================================================================
  deliveryMode = signal<DeliveryMode>('Blended');
  sessionsList = signal<PhaseDeliverySession[]>([]);
  showSessionModal = signal<boolean>(false);
  editingSessionId = signal<string | null>(null);
  newSessionName = signal<string>('');
  newSessionDate = signal<string>('');
  newSessionTime = signal<string>('10:00 AM');
  newSessionDuration = signal<number>(90);
  newSessionInstructor = signal<string>('');
  newSessionVenue = signal<string>('Main Campus - Hall A');
  newSessionMeetingLink = signal<string>('https://meet.google.com/onelms-session');

  // =========================================================================
  // STEP 8: Publish Confirmation Modal (§10)
  // =========================================================================
  showPublishConfirmModal = signal<boolean>(false);

  // =========================================================================
  // STEP 6: Trainee / Batch Assignment (PHASE-07)
  // =========================================================================
  traineeAssignmentMode = signal<TraineeAssignmentMode>('Batch / Cohort');
  selectedBatchName = signal<string>('2026 Q1 Enterprise Cohort - All Field Officers');
  assignedUserIds = signal<string[]>([]);
  traineeSearchQuery = signal<string>('');

  allPlatformUsers = computed(() => this.lms.tenantUsers());

  filteredTrainees = computed(() => {
    const q = this.traineeSearchQuery().trim().toLowerCase();
    const users = this.allPlatformUsers().filter(u => u.role === 'learner' || u.role === 'instructor');
    if (!q) return users;
    return users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // STEP 7: Certificate, Badge & Transcript (Outputs PHASE-08)
  // =========================================================================
  certificateTemplateId = signal<string>('cert-std-01');
  badgeTemplateId = signal<string>('badge-gold-01');
  transcriptReleaseRule = signal<TranscriptReleaseRule>('On Phase Completion');
  minPassingScore = signal<number>(80);

  certificateTemplates = [
    { id: 'cert-std-01', name: 'Standard Professional Phase Certificate', level: 'Phase Milestone', previewUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=400&q=80' },
    { id: 'cert-honors-02', name: 'Executive Honors Phase Credential', level: 'Executive', previewUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=400&q=80' },
    { id: 'cert-compliance-03', name: 'Regulatory & Ethics Compliance Certificate', level: 'Compliance', previewUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80' }
  ];

  badgeTemplates = [
    { id: 'badge-gold-01', name: 'Phase Mastery Gold Badge', icon: 'military_tech', color: 'text-amber-500 bg-amber-500/10' },
    { id: 'badge-star-02', name: 'Top Performer Star', icon: 'stars', color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'badge-verified-03', name: 'Certified Field Specialist', icon: 'verified', color: 'text-emerald-500 bg-emerald-500/10' }
  ];

  // UI state
  formErrorAlert = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const planIdFromParam = params.get('planId') || this.route.snapshot.queryParamMap.get('planId');
      const phaseId = params.get('phaseId');

      if (planIdFromParam) {
        this.parentPlanId.set(planIdFromParam);
      } else {
        const defaultPlan = this.lms.activeLmsPlans()[0] || this.lms.plans()[0];
        if (defaultPlan) {
          this.parentPlanId.set(defaultPlan.id);
        }
      }

      const plan = this.parentPlan();
      if (plan) {
        const existingCount = plan.phases ? plan.phases.length : 0;
        this.phaseSequence.set(existingCount + 1);
        this.phaseName.set(`Phase ${existingCount + 1}: `);
        this.startDate.set(plan.startDate);
        this.endDate.set(plan.endDate);
        if (plan.owner) {
          this.phaseOwner.set({ ...plan.owner });
        }
      }

      // Check if editing existing phase
      if (phaseId && plan) {
        const existingPhase = plan.phases?.find(p => p.id === phaseId);
        if (existingPhase) {
          this.isEditMode.set(true);
          this.editingPhaseId.set(phaseId);
          this.loadExistingPhaseData(existingPhase);
        }
      } else {
        this.initDefaultItems();
      }

      // Dispatch initial step alert
      this.showStepAlert(1, 'entered');
    });
  }

  private initDefaultItems() {
    const today = formatDateDDMMYYYY(new Date());
    this.tasksList.set([
      {
        id: 'task-01',
        taskName: 'Complete Pre-Orientation Assessment & Diagnostics',
        description: 'Learners must complete the diagnostic evaluation before phase content unlocks.',
        assignedToName: this.phaseOwner().name || 'Phase Administrator',
        dueDate: today,
        status: 'Pending',
        isRequiredForUnlock: true
      },
      {
        id: 'task-02',
        taskName: 'Submit Module 1 Practical Case Rubric',
        description: 'Upload field survey report to assigned course instructor.',
        assignedToName: 'Course Lead',
        dueDate: today,
        status: 'Pending',
        isRequiredForUnlock: false
      }
    ]);

    this.sessionsList.set([
      {
        id: 'sess-01',
        sessionName: 'Kickoff Masterclass: Core Principles & Methodology',
        mode: 'Virtual Classroom',
        sessionDate: this.startDate() || today,
        startTime: '10:00 AM',
        durationMinutes: 90,
        instructorName: 'Dr. Tanvir Hossain',
        meetingLink: 'https://meet.google.com/onelms-kickoff'
      }
    ]);
  }

  private loadExistingPhaseData(phase: Phase) {
    this.phaseName.set(phase.name);
    this.phaseDescription.set(phase.description || '');
    this.phaseSequence.set(phase.sequence);
    this.startDate.set(phase.startDate);
    this.endDate.set(phase.endDate);
    
    // Load assigned courses if any
    if (phase.assignedCourses && phase.assignedCourses.length > 0) {
      const courses = this.lms.courses().filter(c => phase.assignedCourses!.includes(c.id));
      this.assignedCoursesList.set(courses.map(c => ({
        courseId: c.id,
        courseTitle: c.title,
        courseCode: c.id.toUpperCase(),
        category: c.category,
        duration: `${c.durationMinutes} mins`,
        lessonsCount: c.modules ? c.modules.reduce((sum, m) => sum + (m.lessons ? m.lessons.length : 0), 0) : 10,
        courseOwnerName: c.instructorName || 'Assigned Faculty Lead'
      })));
    }
  }

  /**
   * Dispatches prominent step alerts matching the Plan creation wizard alert behavior.
   */
  private showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 8: Basic Information & Timeframe',
      2: 'Step 2 of 8: Course Curriculum Assignment',
      3: 'Step 3 of 8: Prerequisites & Access Rules',
      4: 'Step 4 of 8: Operational Tasks & Gates',
      5: 'Step 5 of 8: Delivery Methodology & Classes',
      6: 'Step 6 of 8: Trainee / Batch Assignment',
      7: 'Step 7 of 8: Certificate, Badge & Outputs',
      8: 'Step 8 of 8: Review & Save Phase'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 8 — Basic Information: Specify phase title, description, sequence, and strict non-overlapping timeframe bounds.',
      2: 'Step 2 of 8 — Course Assignment: Select accredited curriculum courses from library and assign course leads.',
      3: 'Step 3 of 8 — Prerequisites: Configure prerequisite milestone rules and task dependency gates.',
      4: 'Step 4 of 8 — Tasks: Configure actionable deliverables, assessment uploads, and operational gating items.',
      5: 'Step 5 of 8 — Delivery Methodology: Choose delivery mode and schedule live classrooms, webinars, and workshops.',
      6: 'Step 6 of 8 — Trainee Assignment: Assign entire organizational cohorts or individual trainees scoped to parent plan.',
      7: 'Step 7 of 8 — Outputs: Configure verifiable milestone certificates, digital badges, and transcript release governance.',
      8: 'Step 8 of 8 — Review & Save: Audit all parameters across the 7 sections and publish or save draft.'
    };

    let title = stepTitles[step] || `Step ${step} of 8`;
    let badge = `STEP ${step} / 8`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step] || `Active: Step ${step} of 8`;
    if (action === 'completed') {
      const prev = step - 1;
      const prevTitle = stepTitles[prev]?.split(': ')[1] || `Step ${prev}`;
      const nextTitle = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevTitle}) verified. Now proceeding to Step ${step} of 8: ${nextTitle}.`;
      type = 'success';
    } else if (action === 'back') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Navigated back to Step ${step} of 8 (${stepName}).`;
      type = 'info';
    } else if (action === 'jump') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Active: Step ${step} of 8 (${stepName}).`;
      type = 'info';
    }

    this.lms.showToast(msg, type, 4000, title, badge);
  }

  // =========================================================================
  // STEPPER NAVIGATION & STEP VALIDATION
  // =========================================================================
  goToStep(stepNumber: number) {
    if (stepNumber < this.currentStep()) {
      this.currentStep.set(stepNumber);
      this.formErrorAlert.set(null);
      this.showStepAlert(stepNumber, 'back');
      return;
    }

    if (this.validateCurrentStep()) {
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(this.currentStep());
        return next;
      });
      this.currentStep.set(stepNumber);
      this.formErrorAlert.set(null);
      this.showStepAlert(stepNumber, 'jump');
    } else {
      this.scrollToFirstError();
    }
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      const current = this.currentStep();
      this.completedSteps.update(set => {
        const next = new Set(set);
        next.add(current);
        return next;
      });
      const nextStepNum = Math.min(current + 1, 8);
      this.currentStep.set(nextStepNum);
      this.formErrorAlert.set(null);
      this.showStepAlert(nextStepNum, 'completed');
    } else {
      this.scrollToFirstError();
    }
  }

  prevStep() {
    const prev = Math.max(this.currentStep() - 1, 1);
    this.currentStep.set(prev);
    this.formErrorAlert.set(null);
    this.showStepAlert(prev, 'back');
  }

  validateCurrentStep(): boolean {
    const step = this.currentStep();
    const plan = this.parentPlan();

    if (step === 1) {
      if (!this.phaseName().trim()) {
        this.formErrorAlert.set('Phase Name is mandatory.');
        return false;
      }
      if (!this.startDate().trim() || !this.endDate().trim()) {
        this.formErrorAlert.set('Start Date and End Date are mandatory in DD/MM/YYYY format.');
        return false;
      }

      // Live date validation against parent plan bounds and sibling phases
      if (plan) {
        const dateCheck = validatePhaseDates(
          this.startDate(),
          this.endDate(),
          plan.startDate,
          plan.endDate,
          this.siblingPhases(),
          this.editingPhaseId() || undefined
        );
        if (!dateCheck.isValid) {
          this.formErrorAlert.set(dateCheck.error || 'Invalid phase timeframe.');
          return false;
        }
      }
      return true;
    }

    if (step === 2) {
      if (this.assignedCoursesList().length === 0) {
        this.formErrorAlert.set('Please assign at least one Course to this Phase.');
        return false;
      }
      return true;
    }

    return true;
  }

  // =========================================================================
  // STEP 2: COURSE ASSIGNMENT ACTIONS
  // =========================================================================
  isCourseAssigned(courseId: string): boolean {
    return this.assignedCoursesList().some(c => c.courseId === courseId);
  }

  isCourseInSiblingPhase(courseId: string): boolean {
    return this.coursesInSiblingPhases().has(courseId);
  }

  getSiblingPhaseForCourse(courseId: string): string | undefined {
    return this.coursesInSiblingPhases().get(courseId);
  }

  toggleCourseAssignment(course: Course) {
    if (this.isCourseInSiblingPhase(course.id)) {
      this.lms.showToast(
        `Course "${course.title}" is already assigned to sibling phase "${this.getSiblingPhaseForCourse(course.id)}". Per OneLMS rules, a course cannot appear in multiple phases of the same plan.`,
        'warning',
        5000,
        'Duplicate Course Blocked'
      );
      return;
    }

    if (this.isCourseAssigned(course.id)) {
      this.assignedCoursesList.update(list => list.filter(c => c.courseId !== course.id));
    } else {
      const lessonsCount = course.modules ? course.modules.reduce((s, m) => s + (m.lessons ? m.lessons.length : 0), 0) : 8;
      this.assignedCoursesList.update(list => [
        ...list,
        {
          courseId: course.id,
          courseTitle: course.title,
          courseCode: course.id.toUpperCase(),
          category: course.category,
          duration: `${course.durationMinutes || 120} mins`,
          lessonsCount: lessonsCount,
          courseOwnerName: course.instructorName || 'Assigned Faculty Lead'
        }
      ]);
    }
  }

  removeAssignedCourse(courseId: string) {
    this.assignedCoursesList.update(list => list.filter(c => c.courseId !== courseId));
  }

  updateCourseOwner(courseId: string, ownerName: string) {
    this.assignedCoursesList.update(list => list.map(c => 
      c.courseId === courseId ? { ...c, courseOwnerName: ownerName } : c
    ));
  }

  // =========================================================================
  // STEP 4: TASK BUILDER MODAL ACTIONS
  // =========================================================================
  openAddTaskModal() {
    this.editingTaskId.set(null);
    this.newTaskName.set('');
    this.newTaskDescription.set('');
    this.newTaskAssignedTo.set(this.phaseOwner().name || 'Administrator');
    this.newTaskDueDate.set(this.endDate() || formatDateDDMMYYYY(new Date()));
    this.newTaskStatus.set('Pending');
    this.newTaskIsRequired.set(true);
    this.showTaskModal.set(true);
  }

  openEditTaskModal(task: PhaseTask) {
    this.editingTaskId.set(task.id);
    this.newTaskName.set(task.taskName);
    this.newTaskDescription.set(task.description || '');
    this.newTaskAssignedTo.set(task.assignedToName || '');
    this.newTaskDueDate.set(task.dueDate);
    this.newTaskStatus.set(task.status);
    this.newTaskIsRequired.set(task.isRequiredForUnlock ?? true);
    this.showTaskModal.set(true);
  }

  closeTaskModal() {
    this.showTaskModal.set(false);
  }

  saveTaskFromModal() {
    if (!this.newTaskName().trim()) {
      this.lms.showToast('Please enter a Task Name.', 'warning', 3000);
      return;
    }

    const editId = this.editingTaskId();
    if (editId) {
      this.tasksList.update(list => list.map(t => {
        if (t.id === editId) {
          return {
            ...t,
            taskName: this.newTaskName().trim(),
            description: this.newTaskDescription().trim() || undefined,
            assignedToName: this.newTaskAssignedTo().trim() || 'Administrator',
            dueDate: this.newTaskDueDate().trim() || this.endDate() || formatDateDDMMYYYY(new Date()),
            status: this.newTaskStatus(),
            isRequiredForUnlock: this.newTaskIsRequired()
          };
        }
        return t;
      }));
      this.lms.showToast('Operational task updated.', 'success', 2500);
    } else {
      const newTask: PhaseTask = {
        id: `task-${Date.now()}`,
        taskName: this.newTaskName().trim(),
        description: this.newTaskDescription().trim() || undefined,
        assignedToName: this.newTaskAssignedTo().trim() || this.phaseOwner().name || 'Administrator',
        dueDate: this.newTaskDueDate().trim() || this.endDate() || formatDateDDMMYYYY(new Date()),
        status: this.newTaskStatus(),
        isRequiredForUnlock: this.newTaskIsRequired()
      };
      this.tasksList.update(list => [...list, newTask]);
      this.lms.showToast('Operational task added.', 'success', 2500);
    }

    this.closeTaskModal();
  }

  removeTask(taskId: string) {
    this.tasksList.update(list => list.filter(t => t.id !== taskId));
    this.lms.showToast('Task removed from phase.', 'info', 2000);
  }

  toggleTaskRequired(taskId: string) {
    this.tasksList.update(list => list.map(t => 
      t.id === taskId ? { ...t, isRequiredForUnlock: !t.isRequiredForUnlock } : t
    ));
  }

  // =========================================================================
  // STEP 5: DELIVERY SESSIONS MODAL ACTIONS
  // =========================================================================
  openAddSessionModal() {
    this.editingSessionId.set(null);
    this.newSessionName.set('');
    this.newSessionDate.set(this.startDate() || formatDateDDMMYYYY(new Date()));
    this.newSessionTime.set('10:00 AM');
    this.newSessionDuration.set(90);
    this.newSessionInstructor.set(this.phaseOwner().name || 'Course Faculty');
    this.newSessionVenue.set('Main Campus - Hall A');
    this.newSessionMeetingLink.set('https://meet.google.com/onelms-session');
    this.showSessionModal.set(true);
  }

  openEditSessionModal(session: PhaseDeliverySession) {
    this.editingSessionId.set(session.id);
    this.newSessionName.set(session.sessionName);
    this.newSessionDate.set(session.sessionDate);
    this.newSessionTime.set(session.startTime || '10:00 AM');
    this.newSessionDuration.set(session.durationMinutes || 90);
    this.newSessionInstructor.set(session.instructorName || '');
    this.newSessionVenue.set(session.venueName || 'Main Campus - Hall A');
    this.newSessionMeetingLink.set(session.meetingLink || 'https://meet.google.com/onelms-session');
    this.showSessionModal.set(true);
  }

  closeSessionModal() {
    this.showSessionModal.set(false);
  }

  saveSessionFromModal() {
    if (!this.newSessionName().trim()) {
      this.lms.showToast('Please enter a Session Title.', 'warning', 3000);
      return;
    }

    const editId = this.editingSessionId();
    if (editId) {
      this.sessionsList.update(list => list.map(s => {
        if (s.id === editId) {
          return {
            ...s,
            sessionName: this.newSessionName().trim(),
            mode: this.deliveryMode(),
            sessionDate: this.newSessionDate().trim() || this.startDate() || formatDateDDMMYYYY(new Date()),
            startTime: this.newSessionTime().trim(),
            durationMinutes: this.newSessionDuration() || 90,
            instructorName: this.newSessionInstructor().trim() || 'Course Faculty',
            venueName: this.deliveryMode() === 'Instructor-Led / In-Person' || this.deliveryMode() === 'Blended' 
              ? (this.newSessionVenue().trim() || 'Main Campus Hall') 
              : undefined,
            meetingLink: this.deliveryMode() === 'Virtual Classroom' || this.deliveryMode() === 'Blended' 
              ? (this.newSessionMeetingLink().trim() || 'https://meet.google.com/onelms-session') 
              : undefined
          };
        }
        return s;
      }));
      this.lms.showToast('Scheduled session updated.', 'success', 2500);
    } else {
      const newSession: PhaseDeliverySession = {
        id: `sess-${Date.now()}`,
        sessionName: this.newSessionName().trim(),
        mode: this.deliveryMode(),
        sessionDate: this.newSessionDate().trim() || this.startDate() || formatDateDDMMYYYY(new Date()),
        startTime: this.newSessionTime().trim(),
        durationMinutes: this.newSessionDuration() || 90,
        instructorName: this.newSessionInstructor().trim() || this.phaseOwner().name || 'Course Faculty',
        venueName: this.deliveryMode() === 'Instructor-Led / In-Person' || this.deliveryMode() === 'Blended' 
          ? (this.newSessionVenue().trim() || 'Main Campus Hall') 
          : undefined,
        meetingLink: this.deliveryMode() === 'Virtual Classroom' || this.deliveryMode() === 'Blended' 
          ? (this.newSessionMeetingLink().trim() || 'https://meet.google.com/onelms-session') 
          : undefined
      };
      this.sessionsList.update(list => [...list, newSession]);
      this.lms.showToast('Delivery class session scheduled.', 'success', 2500);
    }

    this.closeSessionModal();
  }

  removeSession(sessionId: string) {
    this.sessionsList.update(list => list.filter(s => s.id !== sessionId));
    this.lms.showToast('Session removed from schedule.', 'info', 2000);
  }

  // =========================================================================
  // STEP 6: TRAINEE ACTIONS
  // =========================================================================
  toggleTrainee(userId: string) {
    this.assignedUserIds.update(ids => {
      if (ids.includes(userId)) {
        return ids.filter(id => id !== userId);
      }
      return [...ids, userId];
    });
  }

  isTraineeAssigned(userId: string): boolean {
    return this.assignedUserIds().includes(userId);
  }

  selectAllTrainees() {
    const allIds = this.filteredTrainees().map(u => u.id);
    this.assignedUserIds.set(allIds);
  }

  clearAllTrainees() {
    this.assignedUserIds.set([]);
  }

  // =========================================================================
  // STEP 8: SAVE / PUBLISH ACTIONS (§10)
  // =========================================================================
  saveAsDraft() {
    if (!this.phaseName().trim()) {
      this.formErrorAlert.set('Please provide at least a Phase Name to save as draft.');
      return;
    }

    const planId = this.parentPlanId();
    if (!planId) return;

    const draftPhase: Partial<Phase> = {
      id: this.editingPhaseId() || undefined,
      planId: planId,
      name: this.phaseName().trim(),
      sequence: this.phaseSequence(),
      startDate: this.startDate() || formatDateDDMMYYYY(new Date()),
      endDate: this.endDate() || formatDateDDMMYYYY(new Date()),
      status: 'Draft',
      courseCount: this.assignedCoursesList().length,
      taskCount: this.tasksList().length,
      deliveryClassCount: this.sessionsList().length,
      prerequisiteStatus: this.prerequisiteType() === 'None (Free Progression)' ? 'None' : 'Pending',
      certificateBadgeStatus: this.certificateTemplateId() ? 'Configured' : 'None',
      description: this.phaseDescription().trim(),
      assignedCourses: this.assignedCoursesList().map(c => c.courseId)
    };

    if (this.isEditMode() && this.editingPhaseId()) {
      this.lms.updatePhaseInPlan(planId, this.editingPhaseId()!, draftPhase, true);
    } else {
      this.lms.addPhaseToPlan(planId, draftPhase, true);
    }

    this.lms.savePhaseDraft({
      id: draftPhase.id || 'draft-phase',
      planId: planId,
      planName: this.parentPlan()?.name || '',
      currentStep: this.currentStep(),
      basicInfo: {
        name: this.phaseName(),
        description: this.phaseDescription(),
        sequence: this.phaseSequence(),
        startDate: this.startDate(),
        endDate: this.endDate(),
        owner: this.phaseOwner()
      },
      courses: this.assignedCoursesList(),
      prerequisites: {
        type: this.prerequisiteType(),
        requiredPhaseId: this.requiredPriorPhaseId(),
        requiredCourseId: this.requiredCourseId(),
        minScoreThreshold: this.minScoreThreshold(),
        gatedByPendingTasks: this.gatedByPendingTasks(),
        unlockDelayDays: this.unlockDelayDays()
      },
      tasks: this.tasksList(),
      delivery: {
        mode: this.deliveryMode(),
        sessions: this.sessionsList()
      },
      trainees: {
        mode: this.traineeAssignmentMode(),
        assignedUserIds: this.assignedUserIds(),
        batchName: this.selectedBatchName()
      },
      outputs: {
        certificateTemplateId: this.certificateTemplateId(),
        badgeTemplateId: this.badgeTemplateId(),
        transcriptReleaseRule: this.transcriptReleaseRule(),
        minPassingScore: this.minPassingScore()
      },
      updatedAt: new Date().toISOString()
    });

    this.lms.showToast(`Draft saved for "${this.phaseName()}".`, 'info', 4000, 'Phase Draft Persisted');
    this.returnToPlan();
  }

  promptPublishPhase() {
    // Validate required steps 1 & 2 before showing confirmation modal
    if (!this.phaseName().trim()) {
      this.currentStep.set(1);
      this.formErrorAlert.set('Phase Name is mandatory.');
      this.scrollToFirstError();
      return;
    }
    if (!this.startDate().trim() || !this.endDate().trim()) {
      this.currentStep.set(1);
      this.formErrorAlert.set('Start Date and End Date are mandatory.');
      this.scrollToFirstError();
      return;
    }
    if (this.assignedCoursesList().length === 0) {
      this.currentStep.set(2);
      this.formErrorAlert.set('Please assign at least one Course to this Phase.');
      this.scrollToFirstError();
      return;
    }

    this.showPublishConfirmModal.set(true);
  }

  confirmAndPublishPhase() {
    this.showPublishConfirmModal.set(false);
    this.publishPhase();
  }

  publishPhase() {
    for (let step = 1; step <= 2; step++) {
      this.currentStep.set(step);
      if (!this.validateCurrentStep()) {
        this.scrollToFirstError();
        return;
      }
    }

    this.isSubmitting.set(true);
    const planId = this.parentPlanId();

    const finalizedPhase: Partial<Phase> = {
      id: this.editingPhaseId() || undefined,
      planId: planId,
      name: this.phaseName().trim(),
      sequence: this.phaseSequence(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      status: 'Ready',
      courseCount: this.assignedCoursesList().length,
      taskCount: this.tasksList().length,
      deliveryClassCount: this.sessionsList().length,
      prerequisiteStatus: this.prerequisiteType() === 'None (Free Progression)' ? 'None' : 'Pending',
      certificateBadgeStatus: this.certificateTemplateId() ? 'Configured' : 'None',
      description: this.phaseDescription().trim(),
      assignedCourses: this.assignedCoursesList().map(c => c.courseId)
    };

    setTimeout(() => {
      if (this.isEditMode() && this.editingPhaseId()) {
        this.lms.updatePhaseInPlan(planId, this.editingPhaseId()!, finalizedPhase, false);
      } else {
        this.lms.addPhaseToPlan(planId, finalizedPhase, false);
      }
      this.isSubmitting.set(false);
      this.returnToPlan();
    }, 400);
  }

  getCurrentStepTitle(): string {
    const step = this.steps.find(s => s.id === this.currentStep());
    return step ? (step.title || step.shortTitle) : 'Configure Learning Phase';
  }

  getCurrentStepSubtitle(): string {
    switch (this.currentStep()) {
      case 1:
        return 'Specify phase title, description, execution sequence, and strict non-overlapping date bounds within the parent plan.';
      case 2:
        return 'Select accredited courses from the parent catalog, assign course mentors, and set mandatory completion policies.';
      case 3:
        return 'Establish sequential unlocking conditions, minimum score thresholds, and prerequisite dependencies between phases.';
      case 4:
        return 'Add operational deliverables, milestone submissions, gatekeeper sign-offs, and compliance checkpoints.';
      case 5:
        return 'Configure delivery methodology, live virtual workshops, in-person training sessions, and timetable schedule.';
      case 6:
        return 'Assign learner cohorts, department groups, individual trainees, or automated bulk roster synchronization.';
      case 7:
        return 'Configure completion credentials, official certificates, digital skill badges, and transcript generation rules.';
      case 8:
        return 'Review all 7 architectural blocks, run live validation checks, and commit phase configuration.';
      default:
        return 'Configure comprehensive learning phase parameters.';
    }
  }

  resetCurrentStep() {
    const step = this.currentStep();
    if (step === 1) {
      this.phaseName.set('');
      this.phaseDescription.set('');
      this.phaseSequence.set(1);
      if (this.parentPlan()) {
        this.startDate.set(this.parentPlan()!.startDate);
        this.endDate.set(this.parentPlan()!.endDate);
      }
    } else if (step === 2) {
      this.assignedCoursesList.set([]);
    } else if (step === 3) {
      this.prerequisiteType.set('None (Free Progression)');
      this.minScoreThreshold.set(70);
      this.gatedByPendingTasks.set(false);
    } else if (step === 4) {
      this.tasksList.set([]);
    } else if (step === 5) {
      this.sessionsList.set([]);
    } else if (step === 6) {
      this.assignedUserIds.set([]);
    } else if (step === 7) {
      this.certificateTemplateId.set('CERT-STD-2026');
      this.badgeTemplateId.set('BADGE-SKILL-01');
      this.transcriptReleaseRule.set('On Phase Completion');
    }
  }

  copyPlanCode() {
    const code = this.parentPlan()?.planCode;
    if (code && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      this.lms.showToast(`Plan code "${code}" copied to clipboard!`, 'info', 2000, 'Copied');
    }
  }

  returnToPlan() {
    const queryParams = this.route.snapshot.queryParams;
    const returnUrl = queryParams['returnUrl'];
    const returnStep = queryParams['returnStep'];

    if (returnUrl) {
      if (returnStep) {
        this.router.navigateByUrl(`${returnUrl}?step=${returnStep}`);
      } else {
        this.router.navigateByUrl(returnUrl);
      }
      return;
    }

    const planId = this.parentPlanId();
    if (planId) {
      this.router.navigate(['/plans/details', planId]);
    } else {
      this.router.navigate(['/plans']);
    }
  }

  cancelCreation() {
    this.modalService.confirmDiscard({
      title: 'Discard Phase Configuration?',
      message: 'You have unsaved changes in this Phase Creation wizard. You can save your progress as a draft or discard changes to return to the Plan.',
      draftText: 'Save as Draft & Exit',
      discardText: 'Discard & Return to Plan',
      cancelText: 'Continue Editing',
      onDraft: () => this.saveAsDraft(),
      onDiscard: () => this.returnToPlan(),
      onCancel: () => {}
    });
  }

  private scrollToFirstError() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        'input.border-rose-500, select.border-rose-500, textarea.border-rose-500, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty), #form-error-banner'
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
