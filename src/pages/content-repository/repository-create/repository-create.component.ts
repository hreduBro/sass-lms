import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LmsDataService } from '../../../services/lms-data.service';
import {
  RepositoryItem,
  ContentFamily,
  ContentType,
  LearningContentType,
  AssessmentContentType,
  SharingMode,
  ContentStatus,
  AUTHORITATIVE_LEARNING_CONTENT_TYPES,
  AUTHORITATIVE_ASSESSMENT_CONTENT_TYPES,
  formatDateToDDMMYYYY,
  parseDateString
} from '../../../models/content-repository.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';

@Component({
  selector: 'app-repository-create',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomSelectComponent,
    DatePickerComponent,
    StepperComponent
  ],
  templateUrl: './repository-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RepositoryCreateComponent implements OnInit {
  private lmsData = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Stepper state: 1, 2, 3, 4 (Like Create LMS)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  isEditMode = signal<boolean>(false);
  editingItemId = signal<string | null>(null);

  // Validation errors map & Alert banner (Like Create LMS)
  errors = signal<Record<string, string>>({});
  formErrorAlert = signal<string | null>(null);

  // Reusable Stepper Configuration (Like Create LMS)
  steps: StepperStep[] = [
    { id: 1, key: 'details', title: 'Item Details', shortTitle: 'Item Details', sublabel: 'Title, Authors & Dates', icon: 'article' },
    { id: 2, key: 'family', title: 'Content Family & Type', shortTitle: 'Family & Type', sublabel: 'Learning or Assessment', icon: 'category' },
    { id: 3, key: 'setup', title: 'Content Setup', shortTitle: 'Content Setup', sublabel: 'Media, Files & Parameters', icon: 'tune' },
    { id: 4, key: 'sharing', title: 'Sharing & Review', shortTitle: 'Sharing & Review', sublabel: 'Visibility & Publish', icon: 'share' }
  ];

  // Active LMS Context
  activeLms = computed(() => this.lmsData.activeLms());
  activeOrg = computed(() => this.lmsData.activeTenant());
  activeLmsId = computed(() => this.lmsData.activeLms()?.id || this.lmsData.activeLmsId());

  // Sister LMS list for Custom Share (under same Organization)
  sisterLmsList = computed(() => {
    const curId = this.activeLmsId();
    return this.lmsData.activeOrgLmsInstances().filter(l => l.id !== curId);
  });

  // Author pool
  authorOptions = computed<SelectOption[]>(() => {
    return this.lmsData.authors().map(a => ({
      value: a.name,
      label: a.name,
      sublabel: `${a.specialization || 'Author'} · ${a.lmsName || 'LMS'}`
    }));
  });

  // Assessments bank options (for Assessment question set picker)
  assessmentBankOptions = computed<SelectOption[]>(() => {
    return this.lmsData.assessments().map(a => ({
      value: a.assessmentId,
      label: a.title,
      sublabel: `Code: ${a.code || 'ASM'} · ${a.versions?.[0]?.questions?.length || 10} Questions · ${a.scoringMode}`
    }));
  });

  // Learning types
  learningTypes = AUTHORITATIVE_LEARNING_CONTENT_TYPES;
  assessmentTypes = AUTHORITATIVE_ASSESSMENT_CONTENT_TYPES;

  // Selected Family and Type
  selectedFamily = signal<ContentFamily>('Learning');
  selectedType = signal<ContentType>('PDF / Document');

  // Multi-select authors
  selectedAuthors = signal<string[]>(['Tanvir Hossain']);
  newAuthorInput = signal<string>('');

  // Step 1 Form: Item Details
  step1Form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(199)]],
    titleBangla: ['', [Validators.maxLength(199)]],
    publishDate: ['01/11/2026', [Validators.required]],
    hasNoExpiry: [false],
    expiryDate: ['31/12/2027'],
    description: [''],
    thumbnailUrl: [''],
    altText: ['']
  });

  // Step 3 Forms: Type-specific Content Setup
  // Video
  videoForm: FormGroup = this.fb.group({
    source: ['upload'], // 'upload' | 'embed'
    videoUrl: ['https://www.w3schools.com/html/mov_bbb.mp4'],
    fileName: ['Operations_Field_Demonstration.mp4'],
    fileSize: ['24.5 MB'],
    durationMinutes: [15, [Validators.min(1)]]
  });

  // Audio
  audioForm: FormGroup = this.fb.group({
    audioUrl: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
    fileName: ['Field_Grievance_Deescalation_Audio.mp3'],
    fileSize: ['14.2 MB'],
    durationMinutes: [18, [Validators.min(1)]]
  });

  // Document
  documentForm: FormGroup = this.fb.group({
    fileCategory: ['PDF', [Validators.required]],
    fileName: ['BRAC_Field_Operations_Manual_2026.pdf'],
    fileSize: ['3.8 MB'],
    fileUrl: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']
  });

  // Slides
  slidesForm: FormGroup = this.fb.group({
    format: ['.pptx', [Validators.required]],
    slideCount: [36, [Validators.required, Validators.min(1)]],
    fileName: ['Village_Banking_Core_Principles.pptx'],
    fileSize: ['9.4 MB']
  });

  // Reading
  readingForm: FormGroup = this.fb.group({
    contentHtml: [
      `<h3>Core Field Protocols</h3>\n<p>This operating guide establishes mandatory standards for customer protection, interest rate transparency, and dignified loan recovery across rural Village Organizations.</p>`,
      [Validators.required]
    ],
    wordCount: [120],
    estimatedReadMinutes: [3]
  });

  // Recorded Class
  recordedClassForm: FormGroup = this.fb.group({
    deliverySource: ['platform_link'],
    platform: ['Zoom'],
    sessionUrl: ['https://zoom.us/rec/play/sample-session-brac'],
    sessionDate: ['15/10/2026', [Validators.required]],
    durationMinutes: [90, [Validators.required, Validators.min(1)]],
    instructorName: ['Tanvir Hossain']
  });

  // Book
  bookForm: FormGroup = this.fb.group({
    format: ['EPUB', [Validators.required]],
    isbn: ['978-984-34-5892-1'],
    edition: ['2026 Comprehensive Edition'],
    pageCount: [180, [Validators.min(1)]],
    fileName: ['Microfinance_Ethics_Textbook.epub'],
    fileSize: ['6.4 MB']
  });

  // External Link
  externalLinkForm: FormGroup = this.fb.group({
    url: ['https://www.bb.org.bd/en/index.php/financialactivity/fintech', [Validators.required]],
    platformTag: ['Bangladesh Bank Central Circular'],
    openMode: ['new_tab'],
    verificationStatus: ['verified']
  });

  // Question Set
  questionSetForm: FormGroup = this.fb.group({
    assessmentId: ['asm-101', [Validators.required]],
    assessmentTitle: ['Microfinance Client Protection & Ethics Exam'],
    assessmentCode: ['ASM-1972-MF'],
    questionCount: [12],
    scoringMode: ['scored'],
    passMarkPercent: [80]
  });

  // Step 4 Form: Sharing Mode
  step4Form: FormGroup = this.fb.group({
    sharingMode: ['Private', [Validators.required]],
    selectedLmsIds: [[]]
  });

  // Presets for Cover Images
  coverPresets = [
    { label: 'Microfinance & Field', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80' },
    { label: 'Technology & POS', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80' },
    { label: 'Classroom & Training', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80' },
    { label: 'Reading & Books', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80' },
    { label: 'Early Learning', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80' },
    { label: 'Climate & Disaster', url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80' }
  ];

  ngOnInit() {
    const today = formatDateToDDMMYYYY(new Date());
    this.step1Form.patchValue({
      publishDate: today,
      expiryDate: '31/12/2027'
    });

    const editId = this.route.snapshot.paramMap.get('id');
    if (editId) {
      this.isEditMode.set(true);
      this.editingItemId.set(editId);
      this.loadItemForEditing(editId);
    } else {
      this.showStepAlert(1, 'entered');
    }
  }

  loadItemForEditing(id: string) {
    const item = this.lmsData.repositoryItems().find(r => r.id === id);
    if (!item) return;

    this.selectedFamily.set(item.family);
    this.selectedType.set(item.type);
    this.selectedAuthors.set(item.authorNames || ['Tanvir Hossain']);

    this.step1Form.patchValue({
      title: item.title,
      titleBangla: item.titleBangla || '',
      publishDate: item.publishDate,
      hasNoExpiry: item.hasNoExpiry,
      expiryDate: item.expiryDate || '31/12/2027',
      description: item.description || '',
      thumbnailUrl: item.thumbnailUrl || '',
      altText: item.altText || ''
    });

    this.step4Form.patchValue({
      sharingMode: item.sharingMode,
      selectedLmsIds: item.sharedWithLmsIds || []
    });

    // Populate type-specific form
    if (item.type === 'Video' && item.contentConfig) {
      this.videoForm.patchValue(item.contentConfig);
    } else if (item.type === 'Audio' && item.contentConfig) {
      this.audioForm.patchValue(item.contentConfig);
    } else if (item.type === 'PDF / Document' && item.contentConfig) {
      this.documentForm.patchValue(item.contentConfig);
    } else if (item.type === 'Slides / Presentation' && item.contentConfig) {
      this.slidesForm.patchValue(item.contentConfig);
    } else if (item.type === 'Reading' && item.contentConfig) {
      this.readingForm.patchValue(item.contentConfig);
    } else if (item.type === 'Recorded Class' && item.contentConfig) {
      this.recordedClassForm.patchValue(item.contentConfig);
    } else if (item.type === 'Book / E-book' && item.contentConfig) {
      this.bookForm.patchValue(item.contentConfig);
    } else if (item.type === 'External Link' && item.contentConfig) {
      this.externalLinkForm.patchValue(item.contentConfig);
    } else if (item.type === 'Question Bank / Question Set' && item.contentConfig) {
      this.questionSetForm.patchValue(item.contentConfig);
    }

    // Mark previous steps completed for editing
    this.completedSteps.set(new Set([1, 2, 3]));
  }

  // Stepper helper logic
  isStepClickable(step: number): boolean {
    if (step === this.currentStep()) return true;
    if (this.completedSteps().has(step)) return true;
    if (step === 1) return true;
    if (step === 2 && this.completedSteps().has(1)) return true;
    if (step === 3 && this.completedSteps().has(2)) return true;
    if (step === 4 && this.completedSteps().has(3)) return true;
    return false;
  }

  jumpToStep(step: number) {
    if (this.isStepClickable(step)) {
      this.formErrorAlert.set(null);
      if (this.currentStep() !== step) {
        this.currentStep.set(step);
        this.showStepAlert(step, 'jump');
      }
      this.scrollTop();
    }
  }

  // Step 1: Authors Management
  addAuthorFromDropdown(authorName: string) {
    if (!authorName) return;
    const current = this.selectedAuthors();
    if (!current.includes(authorName)) {
      this.selectedAuthors.set([...current, authorName]);
      this.clearError('authors');
    }
  }

  addCustomAuthor() {
    const val = this.newAuthorInput().trim();
    if (!val) return;
    const current = this.selectedAuthors();
    if (!current.includes(val)) {
      this.selectedAuthors.set([...current, val]);
      this.clearError('authors');
    }
    this.newAuthorInput.set('');
  }

  removeAuthor(author: string) {
    const current = this.selectedAuthors().filter(a => a !== author);
    this.selectedAuthors.set(current);
    if (current.length === 0) {
      this.errors.update(e => ({ ...e, authors: 'At least one Author is mandatory.' }));
    }
  }

  // Cover Image Selection
  selectCoverPreset(url: string) {
    this.step1Form.patchValue({
      thumbnailUrl: url,
      altText: `${this.step1Form.get('title')?.value || 'Content'} Cover`
    });
  }

  // Step 2: Family & Type selection
  selectFamily(family: ContentFamily) {
    this.selectedFamily.set(family);
    if (family === 'Learning') {
      this.selectedType.set('PDF / Document');
    } else {
      this.selectedType.set('Question Bank / Question Set');
    }
    this.clearError('type');
  }

  selectType(type: ContentType) {
    this.selectedType.set(type);
    this.clearError('type');
  }

  // Step 4: Sister LMS selection for Custom Share
  toggleSisterLms(lmsId: string) {
    const current: string[] = this.step4Form.get('selectedLmsIds')?.value || [];
    const index = current.indexOf(lmsId);
    let next: string[];
    if (index > -1) {
      next = current.filter(id => id !== lmsId);
    } else {
      next = [...current, lmsId];
    }
    this.step4Form.patchValue({ selectedLmsIds: next });
    this.clearError('sharing');
  }

  selectAllSisterLms() {
    const allIds = this.sisterLmsList().map(l => l.id);
    this.step4Form.patchValue({ selectedLmsIds: allIds });
  }

  deselectAllSisterLms() {
    this.step4Form.patchValue({ selectedLmsIds: [] });
  }

  isSisterLmsSelected(lmsId: string): boolean {
    const current: string[] = this.step4Form.get('selectedLmsIds')?.value || [];
    return current.includes(lmsId);
  }

  // Alert Suite Handlers & Floating Step Alerts
  /**
   * Dispatches a prominent step alert mentioning the exact step number and description,
   * matching the LMS creation wizard alert system.
   */
  showStepAlert(step: number, action: 'entered' | 'completed' | 'back' | 'jump' = 'entered') {
    const stepTitles: Record<number, string> = {
      1: 'Step 1 of 4: Basic Information',
      2: 'Step 2 of 4: Content Family & Type',
      3: 'Step 3 of 4: Content Setup & Media',
      4: 'Step 4 of 4: Sharing & Publishing'
    };

    const stepDescriptions: Record<number, string> = {
      1: 'Step 1 of 4 — Item Details: Configure English title, Bengali title, authors, and schedule window.',
      2: 'Step 2 of 4 — Content Family & Type: Select between Learning and Assessment families, and pick the authoritative content type.',
      3: 'Step 3 of 4 — Content Setup: Configure media files, document uploads, or question set references.',
      4: 'Step 4 of 4 — Sharing & Publishing: Set multi-LMS sharing scope across organizations and publish to repository.'
    };

    let title = stepTitles[step] || `Step ${step} of 4`;
    let badge = `STEP ${step} / 4`;
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    let msg = stepDescriptions[step] || `Active step ${step}.`;
    if (action === 'completed') {
      const prev = step - 1;
      const prevName = stepTitles[prev]?.split(': ')[1] || `Step ${prev}`;
      const nextName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      title = `Step ${prev} Completed Successfully`;
      badge = `STEP ${prev} COMPLETED`;
      msg = `Step ${prev} (${prevName}) saved. Now on Step ${step} of 4: ${nextName}.`;
      type = 'success';
    } else if (action === 'back') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Navigated back to Step ${step} of 4 (${stepName}).`;
      type = 'info';
    } else if (action === 'jump') {
      const stepName = stepTitles[step]?.split(': ')[1] || `Step ${step}`;
      msg = `Active: Step ${step} of 4 (${stepName}).`;
      type = 'info';
    }

    this.lmsData.showToast(msg, type, 4000, title, badge);
  }

  // Step Navigation & Validation
  nextStep() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();

    if (step === 1) {
      if (!this.validateStep1()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 1]));
      this.currentStep.set(2);
      this.showStepAlert(2, 'completed');
      this.scrollTop();
    } else if (step === 2) {
      if (!this.validateStep2()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 1, 2]));
      this.currentStep.set(3);
      this.showStepAlert(3, 'completed');
      this.scrollTop();
    } else if (step === 3) {
      if (!this.validateStep3()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 1, 2, 3]));
      this.currentStep.set(4);
      this.showStepAlert(4, 'completed');
      this.scrollTop();
    }
  }

  prevStep() {
    this.formErrorAlert.set(null);
    const step = this.currentStep();
    if (step > 1) {
      const prevStep = step - 1;
      this.currentStep.set(prevStep);
      this.showStepAlert(prevStep, 'back');
      this.scrollTop();
    }
  }

  hasError(field: string): boolean {
    return !!this.errors()[field];
  }

  getError(field: string): string {
    return this.errors()[field] || '';
  }

  clearError(field: string) {
    if (this.errors()[field]) {
      this.errors.update(errs => {
        const next = { ...errs };
        delete next[field];
        return next;
      });
      if (Object.keys(this.errors()).length === 0) {
        this.formErrorAlert.set(null);
      }
    }
  }

  validateStep1(): boolean {
    const newErrors: Record<string, string> = {};
    const titleVal = (this.step1Form.get('title')?.value || '').trim();
    const pubDate = this.step1Form.get('publishDate')?.value;
    const hasNoExp = this.step1Form.get('hasNoExpiry')?.value;
    const expDate = this.step1Form.get('expiryDate')?.value;

    if (!titleVal) {
      newErrors['title'] = 'Content Title is mandatory and cannot be empty.';
    } else if (titleVal.length > 199) {
      newErrors['title'] = 'Content Title cannot exceed 199 characters.';
    }

    if (!pubDate) {
      newErrors['publishDate'] = 'Publish Date is mandatory (DD/MM/YYYY).';
    }

    if (!hasNoExp && !expDate) {
      newErrors['expiryDate'] = 'Expiry Date is mandatory or select "No Expiry Date".';
    }

    if (!hasNoExp && expDate && pubDate) {
      const p = parseDateString(pubDate);
      const e = parseDateString(expDate);
      if (p && e && e.getTime() < p.getTime()) {
        newErrors['expiryDate'] = 'Expiry Date cannot be earlier than Publish Date.';
      }
    }

    if (this.selectedAuthors().length === 0) {
      newErrors['authors'] = 'Please add at least one Author for content provenance.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstMsg = Object.values(newErrors)[0];
      this.formErrorAlert.set(`Validation Error: ${firstMsg}`);
      this.lmsData.showToast(`Step 1 Validation: ${firstMsg}`, 'error', 4500, 'Step 1 Incomplete', 'STEP 1 / 4');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  validateStep2(): boolean {
    const newErrors: Record<string, string> = {};
    if (!this.selectedType()) {
      newErrors['type'] = 'Please select a Content Type.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstMsg = Object.values(newErrors)[0];
      this.formErrorAlert.set(`Validation Error: ${firstMsg}`);
      this.lmsData.showToast(firstMsg, 'error', 4500, 'Step 2 Incomplete', 'STEP 2 / 4');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  validateStep3(): boolean {
    const newErrors: Record<string, string> = {};
    const type = this.selectedType();

    if (type === 'Video') {
      const dur = this.videoForm.get('durationMinutes')?.value;
      if (dur === null || dur === undefined || dur < 1) {
        newErrors['videoDuration'] = 'Duration must be at least 1 minute.';
      }
    } else if (type === 'Audio') {
      const dur = this.audioForm.get('durationMinutes')?.value;
      if (dur === null || dur === undefined || dur < 1) {
        newErrors['audioDuration'] = 'Duration must be at least 1 minute.';
      }
    } else if (type === 'PDF / Document') {
      const fileName = (this.documentForm.get('fileName')?.value || '').trim();
      if (!fileName) {
        newErrors['docFile'] = 'File name is required.';
      }
    } else if (type === 'External Link') {
      const url = (this.externalLinkForm.get('url')?.value || '').trim();
      if (!url) {
        newErrors['externalUrl'] = 'External Resource URL is mandatory.';
      }
    } else if (type === 'Reading') {
      const content = (this.readingForm.get('contentHtml')?.value || '').trim();
      if (!content) {
        newErrors['readingContent'] = 'Reading article content cannot be empty.';
      }
    } else if (type === 'Question Bank / Question Set') {
      const asmId = this.questionSetForm.get('assessmentId')?.value;
      if (!asmId) {
        newErrors['assessmentId'] = 'Please select a Question Set / Assessment.';
      }
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstMsg = Object.values(newErrors)[0];
      this.formErrorAlert.set(`Validation Error: ${firstMsg}`);
      this.lmsData.showToast(`Step 3 Error: ${firstMsg}`, 'error', 4500, 'Step 3 Incomplete', 'STEP 3 / 4');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  private scrollTop() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private scrollToFirstError() {
    if (typeof window === 'undefined') return;
    setTimeout(() => {
      const errorEl = document.querySelector(
        '#form-error-banner, input.border-rose-500, select.border-rose-500, textarea.border-rose-500, .border-rose-500, .border-red-500, [aria-invalid="true"], [data-error="true"], .text-rose-500:not(:empty)'
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

  // Build Payload
  private buildPayload(isDraft: boolean): Partial<RepositoryItem> {
    const s1 = this.step1Form.value;
    const s4 = this.step4Form.value;
    const type = this.selectedType();

    let contentConfig: any = {};
    switch (type) {
      case 'Video': contentConfig = this.videoForm.value; break;
      case 'Audio': contentConfig = this.audioForm.value; break;
      case 'PDF / Document': contentConfig = this.documentForm.value; break;
      case 'Slides / Presentation': contentConfig = this.slidesForm.value; break;
      case 'Reading': contentConfig = this.readingForm.value; break;
      case 'Recorded Class': contentConfig = this.recordedClassForm.value; break;
      case 'Book / E-book': contentConfig = this.bookForm.value; break;
      case 'External Link': contentConfig = this.externalLinkForm.value; break;
      case 'Question Bank / Question Set': contentConfig = this.questionSetForm.value; break;
    }

    return {
      title: s1.title,
      titleBangla: s1.titleBangla || '',
      family: this.selectedFamily(),
      type,
      authorIds: [],
      authorNames: this.selectedAuthors(),
      publishDate: s1.publishDate,
      expiryDate: s1.hasNoExpiry ? null : s1.expiryDate,
      hasNoExpiry: !!s1.hasNoExpiry,
      description: s1.description || '',
      thumbnailUrl: s1.thumbnailUrl || undefined,
      altText: s1.thumbnailUrl ? (s1.altText || `${s1.title} thumbnail`) : undefined,
      sharingMode: s4.sharingMode,
      sharedWithLmsIds: s4.sharingMode === 'Custom Share' ? (s4.selectedLmsIds || []) : [],
      contentConfig
    };
  }

  // SUBMISSION: SAVE AS DRAFT VS PUBLISH
  saveAsDraft() {
    const titleVal = (this.step1Form.get('title')?.value || '').trim();
    if (!titleVal) {
      this.errors.set({ title: 'Please enter at least a Content Title to save as draft.' });
      this.formErrorAlert.set('Content Title is required to save a draft.');
      this.lmsData.showToast('Please enter a Content Title to save draft', 'error', 4500);
      this.currentStep.set(1);
      this.scrollToFirstError();
      return;
    }

    const payload = this.buildPayload(true);

    if (this.isEditMode() && this.editingItemId()) {
      this.lmsData.updateRepositoryItem(this.editingItemId()!, { ...payload, status: 'Draft' });
      this.lmsData.showToast(`Draft updated for "${payload.title}"`, 'success', 4500, 'Draft Updated', 'STEP 4 / 4');
    } else {
      this.lmsData.createRepositoryItem(payload, true);
      this.lmsData.showToast(`Draft created for "${payload.title}"`, 'success', 4500, 'Draft Saved', 'DRAFT');
    }

    this.router.navigate(['/content-repository']);
  }

  publish() {
    if (!this.validateStep1()) {
      this.currentStep.set(1);
      this.scrollToFirstError();
      return;
    }
    if (!this.validateStep2()) {
      this.currentStep.set(2);
      this.scrollToFirstError();
      return;
    }
    if (!this.validateStep3()) {
      this.currentStep.set(3);
      this.scrollToFirstError();
      return;
    }

    const payload = this.buildPayload(false);

    if (this.isEditMode() && this.editingItemId()) {
      this.lmsData.updateRepositoryItem(this.editingItemId()!, {
        ...payload,
        status: undefined // automatic evaluation between Scheduled and Active!
      });
      this.lmsData.showToast(`Repository item "${payload.title}" updated successfully!`, 'success', 5000, 'Item Updated', 'PUBLISHED');
    } else {
      this.lmsData.createRepositoryItem(payload, false);
      this.lmsData.showToast(`Repository item "${payload.title}" published to Central Store!`, 'success', 5000, 'Item Created', 'PUBLISHED');
    }

    this.router.navigate(['/content-repository']);
  }

  cancel() {
    this.router.navigate(['/content-repository']);
  }
}
