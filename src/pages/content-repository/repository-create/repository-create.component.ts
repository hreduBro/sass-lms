import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit, ViewChild } from '@angular/core';
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
  isScoredAssessmentType,
  isSurveyAssessmentType,
  formatDateToDDMMYYYY,
  parseDateString
} from '../../../models/content-repository.model';
import {
  Assessment,
  AssessmentQuestion
} from '../../../models/assessment.model';
import { CustomSelectComponent, SelectOption } from '../../../components/custom-select/custom-select.component';
import { DatePickerComponent } from '../../../components/date-picker/date-picker.component';
import { StepperComponent, StepperStep } from '../../../components/stepper/stepper.component';
import {
  AssessmentBuilderComponent,
  V3AssessmentBuilderState
} from '../assessment-builder/assessment-builder.component';

@Component({
  selector: 'app-repository-create',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    CustomSelectComponent,
    DatePickerComponent,
    StepperComponent,
    AssessmentBuilderComponent
  ],
  templateUrl: './repository-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RepositoryCreateComponent implements OnInit {
  lmsData = inject(LmsDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  // Stepper state: 1, 2, 3, 4, 5 (§2 Specification)
  currentStep = signal<number>(1);
  completedSteps = signal<Set<number>>(new Set<number>());
  isEditMode = signal<boolean>(false);
  editingItemId = signal<string | null>(null);

  // Validation errors map & Alert banner
  errors = signal<Record<string, string>>({});
  formErrorAlert = signal<string | null>(null);

  // 5 Steps (§2 Create Repository — Step by Step)
  steps: StepperStep[] = [
    { id: 1, key: 'details', title: 'Item Details', shortTitle: 'Item Details', sublabel: 'Title, Authors & Dates', icon: 'article' },
    { id: 2, key: 'family', title: 'Content Family & Type', shortTitle: 'Family & Type', sublabel: 'Fixed Repository Catalog', icon: 'category' },
    { id: 3, key: 'setup', title: 'Content Setup', shortTitle: 'Content Setup', sublabel: 'Authoring & Studio', icon: 'tune' },
    { id: 4, key: 'sharing', title: 'Sharing Mode', shortTitle: 'Sharing Mode', sublabel: 'Multi-LMS Visibility', icon: 'share' },
    { id: 5, key: 'review', title: 'Save & Publish', shortTitle: 'Save & Publish', sublabel: 'Draft or Active Release', icon: 'publish' }
  ];

  // Active LMS Context (workspace LMS is fixed, never selectable §0)
  activeLms = computed(() => this.lmsData.activeLms());
  activeOrg = computed(() => this.lmsData.activeTenant());
  activeLmsId = computed(() => this.lmsData.activeLms()?.id || this.lmsData.activeLmsId());

  // Sister LMS list for Custom Share (under same Organization)
  sisterLmsList = computed(() => {
    const curId = this.activeLmsId();
    return this.lmsData.activeOrgLmsInstances().filter(l => l.id !== curId);
  });

  // Author pool (§2.1 / §2.6 attribution)
  authorOptions = computed<SelectOption[]>(() => {
    return this.lmsData.authors().map(a => ({
      value: a.name,
      label: a.name,
      sublabel: `${a.specialization || 'Author'} · ${a.lmsName || 'LMS'}`
    }));
  });

  // Learning types & Fixed assessment types (§2.2)
  learningTypes = AUTHORITATIVE_LEARNING_CONTENT_TYPES;
  assessmentTypes = AUTHORITATIVE_ASSESSMENT_CONTENT_TYPES;

  readonly isSurveyAssessmentType = isSurveyAssessmentType;
  readonly isScoredAssessmentType = isScoredAssessmentType;

  // Selected Family and Type
  selectedFamily = signal<ContentFamily>('Learning');
  selectedType = signal<ContentType>('PDF / Document');

  // Drag-and-drop state per learning upload type
  activeDragTarget = signal<string | null>(null);

  isDraggingTarget(type: string): boolean {
    return this.activeDragTarget() === type;
  }

  // Multi-select authors
  selectedAuthors = signal<string[]>(['Tanvir Hossain']);
  newAuthorInput = signal<string>('');

  // Step 1 Form: Item Details (§2.1)
  step1Form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(199)]],
    titleBangla: ['', [Validators.maxLength(199)]],
    publishDate: ['01/11/2026', [Validators.required]],
    hasNoExpiry: [false],
    expiryDate: ['31/12/2027'],
    description: [''],
    thumbnailUrl: [''],
    altText: [''],
    tags: ['']
  });

  // =========================================================================
  // Step 3: Learning Forms (§2.3a)
  // Pattern 1: File Upload (PDF / Document, Audio, Slides, Book)
  // Pattern 2: Upload or Link (Video, Recorded Class)
  // Pattern 3: Editor (Reading)
  // Pattern 4: URL Only (External Link)
  // =========================================================================

  // Pattern 1: PDF / Document
  documentForm: FormGroup = this.fb.group({
    fileCategory: ['PDF', [Validators.required]],
    fileName: ['BRAC_Field_Operations_Manual_2026.pdf'],
    fileSize: ['3.8 MB'],
    fileUrl: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf']
  });

  // Pattern 1: Audio
  audioForm: FormGroup = this.fb.group({
    audioUrl: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'],
    fileName: ['Field_Grievance_Deescalation_Audio.mp3'],
    fileSize: ['14.2 MB'],
    durationMinutes: [18, [Validators.min(1)]]
  });

  // Pattern 1: Slides / Presentation (.ppt, .pptx, .odp)
  slidesForm: FormGroup = this.fb.group({
    format: ['.pptx', [Validators.required]],
    slideCount: [36, [Validators.required, Validators.min(1)]],
    fileName: ['Village_Banking_Core_Principles.pptx'],
    fileSize: ['9.4 MB']
  });

  // Pattern 1: Book / E-book (PDF, EPUB)
  bookForm: FormGroup = this.fb.group({
    format: ['EPUB', [Validators.required]],
    isbn: ['978-984-34-5892-1'],
    edition: ['2026 Comprehensive Edition'],
    pageCount: [180, [Validators.min(1)]],
    fileName: ['Microfinance_Ethics_Textbook.epub'],
    fileSize: ['6.4 MB']
  });

  // Pattern 2: Video (Upload or YouTube URL)
  videoForm: FormGroup = this.fb.group({
    source: ['upload'], // 'upload' | 'embed'
    videoUrl: ['https://www.w3schools.com/html/mov_bbb.mp4'],
    fileName: ['Operations_Field_Demonstration.mp4'],
    fileSize: ['24.5 MB'],
    durationMinutes: [15, [Validators.min(1)]]
  });

  // Pattern 2: Recorded Class (Upload recording or Recording link)
  recordedClassForm: FormGroup = this.fb.group({
    deliverySource: ['platform_link'],
    platform: ['Zoom'],
    sessionUrl: ['https://zoom.us/rec/play/sample-session-brac'],
    fileName: [''],
    fileSize: [''],
    sessionDate: ['15/10/2026', [Validators.required]],
    durationMinutes: [90, [Validators.required, Validators.min(1)]],
    instructorName: ['Tanvir Hossain']
  });

  // Pattern 3: Editor (Reading)
  readingForm: FormGroup = this.fb.group({
    contentHtml: [
      `<h3>Core Field Protocols</h3>\n<p>This operating guide establishes mandatory standards for customer protection, interest rate transparency, and dignified loan recovery across rural Village Organizations.</p>`,
      [Validators.required]
    ],
    wordCount: [120],
    estimatedReadMinutes: [3]
  });

  // Pattern 4: URL Only (External Link)
  externalLinkForm: FormGroup = this.fb.group({
    url: ['https://www.bb.org.bd/en/index.php/financialactivity/fintech', [Validators.required]],
    platformTag: ['Bangladesh Bank Central Circular'],
    openMode: ['new_tab'],
    verificationStatus: ['verified']
  });

  // Assessment Builder State (Step 3 Assessment Types §2.3b)
  assessmentBuilderState = signal<V3AssessmentBuilderState | null>(null);

  // Step 4 Form: Sharing Mode (§2.5)
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

    if (item.family === 'Learning' && item.contentConfig) {
      switch (item.type) {
        case 'Video': this.videoForm.patchValue(item.contentConfig); break;
        case 'Audio': this.audioForm.patchValue(item.contentConfig); break;
        case 'PDF / Document': this.documentForm.patchValue(item.contentConfig); break;
        case 'Slides / Presentation': this.slidesForm.patchValue(item.contentConfig); break;
        case 'Reading': this.readingForm.patchValue(item.contentConfig); break;
        case 'Recorded Class': this.recordedClassForm.patchValue(item.contentConfig); break;
        case 'Book / E-book': this.bookForm.patchValue(item.contentConfig); break;
        case 'External Link': this.externalLinkForm.patchValue(item.contentConfig); break;
      }
    } else if (item.family === 'Assessment' && item.contentConfig) {
      const config = item.contentConfig as any;
      const linked = this.lmsData.assessments().find(
        a => a.assessmentId === config.assessmentId || a.code === config.assessmentCode
      );
      const currentVersion = linked?.versions?.find(v => v.versionId === linked.currentVersionId) || linked?.versions?.[0];

      this.assessmentBuilderState.set({
        assessmentId: config.assessmentId || linked?.assessmentId || `ASM-${Date.now()}`,
        scoringMode: config.scoringMode || 'scored',
        traineeInstructions: config.traineeInstructions || linked?.description || '',
        categoryTags: config.categoryTags || linked?.categoryTags || ['General'],
        randomization: config.randomization || 'None',
        passMarkPercent: config.passMarkPercent || currentVersion?.scoringPolicy?.passMarkPercent || 60,
        attemptsAllowed: config.attemptsAllowed || currentVersion?.scoringPolicy?.attempts?.allowed || 1,
        timeLimitMinutes: config.timeLimitMinutes || currentVersion?.scoringPolicy?.timeLimitMinutes || 30,
        difficultyRules: config.difficultyRules || {
          beginnerDrawCount: 2,
          advancedDrawCount: 2,
          expertDrawCount: 1,
          beginnerPoints: 2,
          advancedPoints: 4,
          expertPoints: 6
        },
        questions: currentVersion?.questions || []
      });
    }

    this.completedSteps.set(new Set([1, 2, 3, 4]));
  }

  isStepClickable(step: number): boolean {
    if (step === this.currentStep()) return true;
    if (this.completedSteps().has(step)) return true;
    if (step === 1) return true;
    if (step === 2 && this.completedSteps().has(1)) return true;
    if (step === 3 && this.completedSteps().has(2)) return true;
    if (step === 4 && this.completedSteps().has(3)) return true;
    if (step === 5 && this.completedSteps().has(4)) return true;
    return false;
  }

  jumpToStep(step: number) {
    if (this.isStepClickable(step)) {
      this.formErrorAlert.set(null);
      this.currentStep.set(step);
      this.scrollTop();
    }
  }

  nextStep() {
    const cur = this.currentStep();
    if (cur === 1) {
      if (!this.validateStep1()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 1]));
      this.currentStep.set(2);
    } else if (cur === 2) {
      if (!this.validateStep2()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 2]));
      this.currentStep.set(3);
    } else if (cur === 3) {
      if (!this.validateStep3()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 3]));
      this.currentStep.set(4);
    } else if (cur === 4) {
      if (!this.validateStep4()) {
        this.scrollToFirstError();
        return;
      }
      this.completedSteps.update(s => new Set([...s, 4]));
      this.currentStep.set(5);
    }
    this.scrollTop();
  }

  prevStep() {
    if (this.currentStep() > 1) {
      this.formErrorAlert.set(null);
      this.currentStep.update(s => s - 1);
      this.scrollTop();
    }
  }

  selectFamily(family: ContentFamily) {
    if (this.selectedFamily() !== family) {
      this.selectedFamily.set(family);
      if (family === 'Learning') {
        this.selectedType.set('PDF / Document');
      } else {
        this.selectedType.set('Quiz');
      }
    }
  }

  selectType(type: ContentType) {
    this.selectedType.set(type);
  }

  isAssessmentType(type: ContentType | string | null | undefined): boolean {
    return (
      isScoredAssessmentType(type) ||
      isSurveyAssessmentType(type)
    );
  }

  // Cover image preset picker
  selectCoverPreset(url: string) {
    this.step1Form.patchValue({ thumbnailUrl: url });
  }

  // Authors management
  addAuthorFromDropdown(authorName: any) {
    if (!authorName) return;
    const current = this.selectedAuthors();
    if (!current.includes(authorName)) {
      this.selectedAuthors.set([...current, authorName]);
      this.clearError('authors');
    }
  }

  addCustomAuthor() {
    const val = this.newAuthorInput().trim();
    if (val && !this.selectedAuthors().includes(val)) {
      this.selectedAuthors.set([...this.selectedAuthors(), val]);
      this.newAuthorInput.set('');
      this.clearError('authors');
    }
  }

  removeAuthor(authorName: string) {
    this.selectedAuthors.set(this.selectedAuthors().filter(a => a !== authorName));
  }

  // Sibling LMS selection for Custom Share
  isSisterLmsSelected(id: string): boolean {
    const selected: string[] = this.step4Form.get('selectedLmsIds')?.value || [];
    return selected.includes(id);
  }

  toggleSisterLms(id: string) {
    const current: string[] = this.step4Form.get('selectedLmsIds')?.value || [];
    if (current.includes(id)) {
      this.step4Form.patchValue({
        selectedLmsIds: current.filter(x => x !== id)
      });
    } else {
      this.step4Form.patchValue({
        selectedLmsIds: [...current, id]
      });
    }
    this.clearError('sharingLms');
  }

  selectAllSisterLms() {
    const allIds = this.sisterLmsList().map(s => s.id);
    this.step4Form.patchValue({ selectedLmsIds: allIds });
    this.clearError('sharingLms');
  }

  deselectAllSisterLms() {
    this.step4Form.patchValue({ selectedLmsIds: [] });
  }

  // Assessment Builder Child handler
  onAssessmentBuilderChange(state: V3AssessmentBuilderState) {
    this.assessmentBuilderState.set(state);
  }

  // Type-specific Upload Policies (§2.3a)
  private readonly uploadPolicies: Record<string, { exts: string[]; maxBytes: number; label: string }> = {
    'PDF / Document': {
      exts: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
      maxBytes: 50 * 1024 * 1024,
      label: 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (Max 50MB)'
    },
    'Audio': {
      exts: ['.mp3', '.aac'],
      maxBytes: 100 * 1024 * 1024,
      label: 'MP3, AAC (Max 100MB)'
    },
    'Slides / Presentation': {
      exts: ['.ppt', '.pptx', '.odp'],
      maxBytes: 50 * 1024 * 1024,
      label: '.ppt, .pptx, .odp (Max 50MB)'
    },
    'Book / E-book': {
      exts: ['.pdf', '.epub'],
      maxBytes: 50 * 1024 * 1024,
      label: 'PDF, EPUB (Max 50MB)'
    },
    'Video': {
      exts: ['.mp4', '.webm'],
      maxBytes: 250 * 1024 * 1024,
      label: 'MP4, WebM (Max 250MB)'
    },
    'Recorded Class': {
      exts: ['.mp4', '.webm'],
      maxBytes: 250 * 1024 * 1024,
      label: 'MP4, WebM (Max 250MB)'
    }
  };

  getUploadAccept(type: string): string {
    const policy = this.uploadPolicies[type];
    return policy ? policy.exts.join(',') : '';
  }

  getUploadHint(type: string): string {
    const policy = this.uploadPolicies[type];
    return policy ? `Allowed formats: ${policy.label}` : '';
  }

  // Consolidated Learning File Processing (§2.3a)
  processLearningFile(type: string, file: File): boolean {
    const policy = this.uploadPolicies[type];
    const fileName = file.name.toLowerCase();

    if (policy) {
      const hasValidExt = policy.exts.some(ext => fileName.endsWith(ext));
      if (!hasValidExt) {
        this.lmsData.showToast(
          `Invalid file format for "${file.name}". Expected: ${policy.label}`,
          'error',
          5000
        );
        return false;
      }

      if (file.size > policy.maxBytes) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        const limitMb = (policy.maxBytes / (1024 * 1024)).toFixed(0);
        this.lmsData.showToast(
          `File "${file.name}" exceeds the ${limitMb}MB limit (${sizeMb} MB).`,
          'error',
          5000
        );
        return false;
      }
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    switch (type) {
      case 'PDF / Document':
        this.documentForm.patchValue({ fileName: file.name, fileSize: sizeFormatted });
        this.clearError('doc');
        break;
      case 'Audio':
        this.audioForm.patchValue({ fileName: file.name, fileSize: sizeFormatted });
        this.clearError('audio');
        break;
      case 'Slides / Presentation':
        this.slidesForm.patchValue({ fileName: file.name, fileSize: sizeFormatted });
        this.clearError('slides');
        break;
      case 'Book / E-book':
        this.bookForm.patchValue({ fileName: file.name, fileSize: sizeFormatted });
        this.clearError('book');
        break;
      case 'Video':
        this.videoForm.patchValue({ fileName: file.name, fileSize: sizeFormatted });
        this.clearError('video');
        break;
      case 'Recorded Class':
        this.recordedClassForm.patchValue({
          fileName: file.name,
          fileSize: sizeFormatted,
          sessionUrl: `uploaded://${file.name}`
        });
        this.clearError('recordedDate');
        break;
    }

    this.lmsData.showToast(`Selected file for ${type}: ${file.name} (${sizeFormatted})`, 'info');
    return true;
  }

  // Browse file selector
  onCustomFileSelected(type: string, event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.processLearningFile(type, target.files[0]);
      target.value = ''; // Reset so the same file can be selected again
    }
  }

  // Drag & drop handlers
  onFileDragOver(type: string, event: DragEvent) {
    event.preventDefault();
    this.activeDragTarget.set(type);
  }

  onFileDragLeave(type: string, event: DragEvent) {
    if (this.activeDragTarget() === type) {
      this.activeDragTarget.set(null);
    }
  }

  onFileDrop(type: string, event: DragEvent) {
    event.preventDefault();
    this.activeDragTarget.set(null);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processLearningFile(type, event.dataTransfer.files[0]);
    }
  }

  // Remove uploaded file
  removeLearningFile(type: string) {
    this.activeDragTarget.set(null);
    switch (type) {
      case 'PDF / Document':
        this.documentForm.patchValue({ fileName: '', fileSize: '' });
        break;
      case 'Audio':
        this.audioForm.patchValue({ fileName: '', fileSize: '' });
        break;
      case 'Slides / Presentation':
        this.slidesForm.patchValue({ fileName: '', fileSize: '' });
        break;
      case 'Book / E-book':
        this.bookForm.patchValue({ fileName: '', fileSize: '' });
        break;
      case 'Video':
        this.videoForm.patchValue({ fileName: '', fileSize: '' });
        break;
      case 'Recorded Class':
        this.recordedClassForm.patchValue({
          fileName: '',
          fileSize: '',
          sessionUrl: ''
        });
        break;
    }
  }

  // Switch video source
  setVideoSource(source: 'upload' | 'embed') {
    this.videoForm.patchValue({ source });
    if (source === 'embed') {
      this.videoForm.patchValue({ fileName: '', fileSize: '' });
    }
  }

  // Switch recorded class source
  setRecordedClassSource(deliverySource: 'upload' | 'platform_link') {
    this.recordedClassForm.patchValue({ deliverySource });
    if (deliverySource === 'platform_link') {
      this.recordedClassForm.patchValue({ fileName: '', fileSize: '' });
    }
  }

  // Validation helpers
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
      this.lmsData.showToast(`Step 1 Validation: ${firstMsg}`, 'error', 4500, 'Step 1 Incomplete', 'STEP 1 / 5');
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
      this.lmsData.showToast(firstMsg, 'error', 4500, 'Step 2 Incomplete', 'STEP 2 / 5');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  validateStep3(): boolean {
    const newErrors: Record<string, string> = {};
    const type = this.selectedType();

    if (this.isAssessmentType(type)) {
      const builder = this.assessmentBuilderState();
      if (!builder || builder.questions.length === 0) {
        newErrors['assessmentQuestions'] = 'At least one question must be authored in Question Studio.';
      } else {
        const hasBlankPrompt = builder.questions.some(q => !q.text || !q.text.trim());
        if (hasBlankPrompt) {
          newErrors['assessmentQuestions'] = 'All questions in Question Studio must have text prompts.';
        }

        // By difficulty validation rules (§2.3b)
        if (builder.randomization === 'By difficulty' && !isSurveyAssessmentType(type)) {
          const rules = builder.difficultyRules;
          let beg = 0, adv = 0, exp = 0;
          builder.questions.forEach(q => {
            const d = (q.difficulty || '').toLowerCase();
            if (d === 'beginner') beg++;
            else if (d === 'advanced' || d === 'intermediate') adv++;
            else if (d === 'expert') exp++;
          });

          if (beg < rules.beginnerDrawCount) {
            newErrors['difficultyQuota'] = `Beginner pool has ${beg} questions but requires ${rules.beginnerDrawCount} drawn.`;
          }
          if (adv < rules.advancedDrawCount) {
            newErrors['difficultyQuota'] = `Advanced pool has ${adv} questions but requires ${rules.advancedDrawCount} drawn.`;
          }
          if (exp < rules.expertDrawCount) {
            newErrors['difficultyQuota'] = `Expert pool has ${exp} questions but requires ${rules.expertDrawCount} drawn.`;
          }
        }
      }
    } else {
      if (type === 'Video') {
        const src = this.videoForm.get('source')?.value;
        if (src === 'upload' && !this.videoForm.get('fileName')?.value) {
          newErrors['video'] = 'Please upload a video file.';
        } else if (src === 'embed' && !this.videoForm.get('videoUrl')?.value) {
          newErrors['video'] = 'Please provide a valid YouTube / streaming URL.';
        }
      } else if (type === 'PDF / Document') {
        if (!this.documentForm.get('fileName')?.value) {
          newErrors['doc'] = 'Please upload a document file.';
        }
      } else if (type === 'Audio') {
        if (!this.audioForm.get('fileName')?.value) {
          newErrors['audio'] = 'Please upload an audio file.';
        }
      } else if (type === 'Slides / Presentation') {
        if (!this.slidesForm.get('fileName')?.value) {
          newErrors['slides'] = 'Please upload a presentation file (.ppt, .pptx, .odp).';
        }
      } else if (type === 'Reading') {
        const html = (this.readingForm.get('contentHtml')?.value || '').trim();
        if (!html) {
          newErrors['reading'] = 'Reading article content is required.';
        }
      } else if (type === 'Recorded Class') {
        const date = this.recordedClassForm.get('sessionDate')?.value;
        if (!date) {
          newErrors['recordedDate'] = 'Recorded session date is required.';
        }
      } else if (type === 'Book / E-book') {
        if (!this.bookForm.get('fileName')?.value) {
          newErrors['book'] = 'Please upload a book file (PDF or EPUB).';
        }
      } else if (type === 'External Link') {
        const url = (this.externalLinkForm.get('url')?.value || '').trim();
        if (!url || !url.startsWith('http')) {
          newErrors['extUrl'] = 'A valid http:// or https:// URL is required.';
        }
      }
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstMsg = Object.values(newErrors)[0];
      this.formErrorAlert.set(`Validation Error: ${firstMsg}`);
      this.lmsData.showToast(`Step 3 Error: ${firstMsg}`, 'error', 4500, 'Step 3 Incomplete', 'STEP 3 / 5');
      return false;
    }

    this.formErrorAlert.set(null);
    return true;
  }

  validateStep4(): boolean {
    const newErrors: Record<string, string> = {};
    const mode = this.step4Form.get('sharingMode')?.value;
    const selected = this.step4Form.get('selectedLmsIds')?.value || [];

    if (mode === 'Custom Share' && selected.length === 0) {
      newErrors['sharingLms'] = 'Please select at least one sibling LMS instance for Custom Share.';
    }

    this.errors.set(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstMsg = Object.values(newErrors)[0];
      this.formErrorAlert.set(`Validation Error: ${firstMsg}`);
      this.lmsData.showToast(firstMsg, 'error', 4500, 'Step 4 Incomplete', 'STEP 4 / 5');
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
    if (this.isAssessmentType(type)) {
      const bState = this.assessmentBuilderState();
      const asmId = bState?.assessmentId || `ASM-${Date.now()}`;
      const qCount = bState?.questions?.length || 0;
      const isSurvey = isSurveyAssessmentType(type);

      contentConfig = {
        assessmentId: asmId,
        assessmentTitle: s1.title,
        assessmentCode: `CODE-${asmId}`,
        questionCount: qCount,
        scoringMode: isSurvey ? 'unscored' : (bState?.scoringMode || 'scored'),
        passMarkPercent: isSurvey ? undefined : bState?.passMarkPercent,
        totalMarks: isSurvey ? 0 : (bState?.questions || []).reduce((sum, q) => sum + (q.points || 0), 0),
        randomization: bState?.randomization || 'None',
        difficultyRules: bState?.difficultyRules,
        traineeInstructions: bState?.traineeInstructions,
        categoryTags: bState?.categoryTags,
        attemptsAllowed: bState?.attemptsAllowed,
        timeLimitMinutes: bState?.timeLimitMinutes
      };

      // Ensure linked assessment entity exists in assessments store
      this.syncAssessmentEntity(asmId, s1.title, type as AssessmentContentType, bState, isDraft);
    } else {
      switch (type) {
        case 'Video': contentConfig = this.videoForm.value; break;
        case 'Audio': contentConfig = this.audioForm.value; break;
        case 'PDF / Document': contentConfig = this.documentForm.value; break;
        case 'Slides / Presentation': contentConfig = this.slidesForm.value; break;
        case 'Reading': contentConfig = this.readingForm.value; break;
        case 'Recorded Class': contentConfig = this.recordedClassForm.value; break;
        case 'Book / E-book': contentConfig = this.bookForm.value; break;
        case 'External Link': contentConfig = this.externalLinkForm.value; break;
      }
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

  private syncAssessmentEntity(
    asmId: string,
    title: string,
    type: AssessmentContentType,
    bState: V3AssessmentBuilderState | null,
    isDraft: boolean
  ) {
    const existing = this.lmsData.assessments().find(a => a.assessmentId === asmId);
    const questions = bState?.questions || [];
    const scoringPolicy = {
      totalMarks: (bState?.questions || []).reduce((s, q) => s + (q.points || 0), 0),
      passMarkPercent: bState?.passMarkPercent || 60,
      negativeMarking: { enabled: false, penalty: 0 },
      attempts: { allowed: bState?.attemptsAllowed || 1, keep: 'highest' as any },
      timeLimitMinutes: bState?.timeLimitMinutes || null,
      resultDisplay: { showScore: 'afterSubmit' as any, showCorrect: true, showFeedback: true }
    };

    if (existing) {
      this.lmsData.assessments.update(list =>
        list.map(a => {
          if (a.assessmentId !== asmId) return a;
          const v1 = a.versions?.[0] || {
            versionId: `${asmId}-v1`,
            assessmentId: asmId,
            versionLabel: 'v1',
            state: isDraft ? 'draft' : 'published-current',
            responseCount: 0,
            questions: [],
            scoringPolicy
          };
          return {
            ...a,
            title,
            scoringMode: bState?.scoringMode || 'scored',
            categoryTags: bState?.categoryTags || ['General'],
            versions: [{ ...v1, questions, scoringPolicy, state: isDraft ? 'draft' : 'published-current' }]
          };
        })
      );
    } else {
      const newAsm: Assessment = {
        assessmentId: asmId,
        code: `ASM-${Date.now().toString().slice(-4)}`,
        title,
        type: type === 'Exam' ? 'exam' : (type === 'Survey' ? 'survey' : 'quiz'),
        categoryTags: bState?.categoryTags || ['General'],
        scoringMode: bState?.scoringMode || 'scored',
        currentVersionId: `${asmId}-v1`,
        status: isDraft ? 'draft' : 'published',
        sharingLevel: 'org',
        usedInCount: 0,
        versions: [
          {
            versionId: `${asmId}-v1`,
            assessmentId: asmId,
            versionLabel: 'v1',
            state: isDraft ? 'draft' : 'published-current',
            responseCount: 0,
            questions,
            scoringPolicy
          }
        ],
        createdBy: 'Content Repository Author',
        createdAt: formatDateToDDMMYYYY(new Date()),
        updatedAt: formatDateToDDMMYYYY(new Date())
      };
      this.lmsData.assessments.update(prev => [newAsm, ...prev]);
    }
  }

  // SUBMISSION: SAVE AS DRAFT VS PUBLISH (§2.7)
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
      this.lmsData.showToast(`Draft updated for "${payload.title}"`, 'success', 4500, 'Draft Updated');
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
    if (!this.validateStep4()) {
      this.currentStep.set(4);
      this.scrollToFirstError();
      return;
    }

    const payload = this.buildPayload(false);

    if (this.isEditMode() && this.editingItemId()) {
      this.lmsData.updateRepositoryItem(this.editingItemId()!, {
        ...payload,
        status: undefined // automatic evaluation between Scheduled and Active!
      });
      this.lmsData.showToast(`Repository item published: "${payload.title}"`, 'success', 4500, 'Item Published');
    } else {
      const created = this.lmsData.createRepositoryItem(payload, false);
      this.lmsData.showToast(`Published repository item "${created.title}" (${created.status})`, 'success', 4500, 'Publication Complete');
    }

    this.router.navigate(['/content-repository']);
  }

  cancel() {
    this.router.navigate(['/content-repository']);
  }
}
