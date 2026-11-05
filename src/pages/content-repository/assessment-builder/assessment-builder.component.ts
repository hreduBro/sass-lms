import { Component, Input, Output, EventEmitter, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomSelectComponent } from '../../../components/custom-select/custom-select.component';
import {
  AssessmentContentType,
  V3AssessmentDifficulty,
  V3RandomizationMode,
  V3DifficultyRules,
  AssessmentGradingLabel
} from '../../../models/content-repository.model';
import {
  AssessmentQuestion,
  AssessmentQuestionOption,
  QuestionAuthorAttachment
} from '../../../models/assessment.model';
import { LocalPersistenceRepository } from '../../../services/local-persistence.repository';

export type V3QuestionType = 'Single choice' | 'Multiple choice' | 'Fill in the blank' | 'Q&A' | 'File upload';

export interface V3AssessmentBuilderState {
  assessmentId: string;
  scoringMode: 'scored' | 'unscored';
  traineeInstructions: string;
  categoryTags: string[];
  randomization: V3RandomizationMode;
  passMarkPercent: number;
  attemptsAllowed: number;
  timeLimitMinutes: number | null;
  difficultyRules: V3DifficultyRules;
  questions: AssessmentQuestion[];
}

@Component({
  selector: 'app-assessment-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, CustomSelectComponent],
  templateUrl: './assessment-builder.component.html',
  styleUrls: ['./assessment-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AssessmentBuilderComponent {
  // Inputs from parent wizard
  @Input({ required: true }) assessmentType!: AssessmentContentType;
  @Input() initialAssessmentId?: string;
  @Input() initialData?: Partial<V3AssessmentBuilderState>;

  // Two-way or output change event
  @Output() stateChange = new EventEmitter<V3AssessmentBuilderState>();

  // 4 internal sub-steps
  currentPart = signal<1 | 2 | 3 | 4>(1);
  readonly studioSections = [
    { id: 1, label: 'Basic Info', icon: 'info' },
    { id: 2, label: 'Scoring & Rules', icon: 'tune' },
    { id: 3, label: 'Question Studio', icon: 'quiz' },
    { id: 4, label: 'Preview', icon: 'visibility' }
  ] as const;

  // Part 1: Basic Info
  assessmentId = signal<string>('');
  scoringMode = signal<'scored' | 'unscored'>('scored');
  traineeInstructions = signal<string>('');
  categoryTags = signal<string[]>(['General']);
  newTagInput = signal<string>('');
  randomization = signal<V3RandomizationMode>('None');

  // Part 2: Scoring & Rules
  passMarkPercent = signal<number>(60);
  attemptsAllowed = signal<number>(1);
  timeLimitMinutes = signal<number | null>(30);

  // Difficulty Draw Rules (when By difficulty)
  beginnerDrawCount = signal<number>(2);
  advancedDrawCount = signal<number>(2);
  expertDrawCount = signal<number>(1);
  beginnerPoints = signal<number>(2);
  advancedPoints = signal<number>(4);
  expertPoints = signal<number>(6);

  // Part 3: Question Studio
  questions = signal<AssessmentQuestion[]>([]);
  activeQuestionIndex = signal<number | null>(0);

  // Preview sample state (Part 4)
  previewSampleSeed = signal<number>(1);

  // Supported V3 question types
  readonly questionTypes: V3QuestionType[] = [
    'Single choice',
    'Multiple choice',
    'Fill in the blank',
    'Q&A',
    'File upload'
  ];

  readonly difficulties: V3AssessmentDifficulty[] = ['Beginner', 'Advanced', 'Expert'];

  // File Upload Authoring State
  isDraggingAttachment = signal<boolean>(false);
  isUploadingAttachment = signal<boolean>(false);
  attachmentError = signal<string | null>(null);

  readonly fileUploadPolicy = {
    allowedExts: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.zip'],
    maxBytes: 50 * 1024 * 1024,
    label: 'PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP (Max 50MB)'
  };

  isSurvey = computed(() => this.assessmentType === 'Survey');

  // Derived grading label (§2.4)
  derivedGradingLabel = computed<AssessmentGradingLabel | ''>(() => {
    if (this.isSurvey()) return '';
    const qs = this.questions();
    if (qs.length === 0) return 'Auto';
    const hasManual = qs.some(q => q.manualGraded || q.type === 'essay' || q.type === 'fileUpload' || (q.type as any) === 'Q&A' || (q.type as any) === 'File upload');
    return hasManual ? 'Needs manual grading' : 'Auto';
  });

  // Difficulty counts live stats (§2.3b)
  difficultyCounts = computed(() => {
    const qs = this.questions();
    let beginner = 0;
    let advanced = 0;
    let expert = 0;
    qs.forEach(q => {
      const diff = (q.difficulty || '').toLowerCase();
      if (diff === 'beginner') beginner++;
      else if (diff === 'advanced' || diff === 'intermediate') advanced++;
      else if (diff === 'expert') expert++;
    });
    return {
      beginnerAdded: beginner,
      advancedAdded: advanced,
      expertAdded: expert,
      beginnerDrawn: this.beginnerDrawCount(),
      advancedDrawn: this.advancedDrawCount(),
      expertDrawn: this.expertDrawCount(),
      beginnerValid: beginner >= this.beginnerDrawCount(),
      advancedValid: advanced >= this.advancedDrawCount(),
      expertValid: expert >= this.expertDrawCount()
    };
  });

  // Total marks computed
  totalMarks = computed<number>(() => {
    if (this.isSurvey() || this.scoringMode() === 'unscored') return 0;
    if (this.randomization() === 'By difficulty') {
      return (
        this.beginnerDrawCount() * this.beginnerPoints() +
        this.advancedDrawCount() * this.advancedPoints() +
        this.expertDrawCount() * this.expertPoints()
      );
    }
    return this.questions().reduce((sum, q) => sum + (q.points || 0), 0);
  });

  // Preview draw items
  previewQuestions = computed<AssessmentQuestion[]>(() => {
    const qs = this.questions();
    const mode = this.randomization();
    const _seed = this.previewSampleSeed(); // trigger re-render on re-sample

    if (mode === 'None') {
      return qs;
    }
    if (mode === 'Shuffle') {
      return [...qs].sort(() => Math.random() - 0.5);
    }
    if (mode === 'By difficulty') {
      const bPool = qs.filter(q => (q.difficulty || '').toLowerCase() === 'beginner');
      const aPool = qs.filter(q => ['advanced', 'intermediate'].includes((q.difficulty || '').toLowerCase()));
      const ePool = qs.filter(q => (q.difficulty || '').toLowerCase() === 'expert');

      const bSample = [...bPool].sort(() => Math.random() - 0.5).slice(0, this.beginnerDrawCount()).map(q => ({ ...q, points: this.beginnerPoints() }));
      const aSample = [...aPool].sort(() => Math.random() - 0.5).slice(0, this.advancedDrawCount()).map(q => ({ ...q, points: this.advancedPoints() }));
      const eSample = [...ePool].sort(() => Math.random() - 0.5).slice(0, this.expertDrawCount()).map(q => ({ ...q, points: this.expertPoints() }));

      return [...bSample, ...aSample, ...eSample];
    }
    return qs;
  });

  constructor() {
    // Whenever anything changes, notify parent
    effect(() => {
      const state: V3AssessmentBuilderState = {
        assessmentId: this.assessmentId(),
        scoringMode: this.isSurvey() ? 'unscored' : this.scoringMode(),
        traineeInstructions: this.traineeInstructions(),
        categoryTags: this.categoryTags(),
        randomization: this.isSurvey() && this.randomization() === 'By difficulty' ? 'None' : this.randomization(),
        passMarkPercent: this.passMarkPercent(),
        attemptsAllowed: this.attemptsAllowed(),
        timeLimitMinutes: this.timeLimitMinutes(),
        difficultyRules: {
          beginnerDrawCount: this.beginnerDrawCount(),
          advancedDrawCount: this.advancedDrawCount(),
          expertDrawCount: this.expertDrawCount(),
          beginnerPoints: this.beginnerPoints(),
          advancedPoints: this.advancedPoints(),
          expertPoints: this.expertPoints()
        },
        questions: this.questions()
      };
      this.stateChange.emit(state);
    });
  }

  ngOnInit() {
    this.assessmentId.set(this.initialAssessmentId || `ASM-${Math.floor(1000 + Math.random() * 9000)}`);
    if (this.isSurvey()) {
      this.scoringMode.set('unscored');
      if (this.randomization() === 'By difficulty') {
        this.randomization.set('None');
      }
    }
    if (this.initialData) {
      if (this.initialData.assessmentId) this.assessmentId.set(this.initialData.assessmentId);
      if (this.initialData.scoringMode) this.scoringMode.set(this.initialData.scoringMode);
      if (this.initialData.traineeInstructions) this.traineeInstructions.set(this.initialData.traineeInstructions);
      if (this.initialData.categoryTags) this.categoryTags.set(this.initialData.categoryTags);
      if (this.initialData.randomization) this.randomization.set(this.initialData.randomization);
      if (this.initialData.passMarkPercent !== undefined) this.passMarkPercent.set(this.initialData.passMarkPercent);
      if (this.initialData.attemptsAllowed !== undefined) this.attemptsAllowed.set(this.initialData.attemptsAllowed);
      if (this.initialData.timeLimitMinutes !== undefined) this.timeLimitMinutes.set(this.initialData.timeLimitMinutes);
      if (this.initialData.difficultyRules) {
        this.beginnerDrawCount.set(this.initialData.difficultyRules.beginnerDrawCount);
        this.advancedDrawCount.set(this.initialData.difficultyRules.advancedDrawCount);
        this.expertDrawCount.set(this.initialData.difficultyRules.expertDrawCount);
        this.beginnerPoints.set(this.initialData.difficultyRules.beginnerPoints);
        this.advancedPoints.set(this.initialData.difficultyRules.advancedPoints);
        this.expertPoints.set(this.initialData.difficultyRules.expertPoints);
      }
      if (this.initialData.questions && this.initialData.questions.length > 0) {
        this.questions.set(this.initialData.questions);
      }
    }

    if (this.questions().length === 0) {
      this.addQuestion('Single choice');
    }
  }

  setPart(part: 1 | 2 | 3 | 4) {
    this.currentPart.set(part);
  }

  addTag() {
    const val = this.newTagInput().trim();
    if (val && !this.categoryTags().includes(val)) {
      this.categoryTags.update(tags => [...tags, val]);
      this.newTagInput.set('');
    }
  }

  removeTag(tag: string) {
    this.categoryTags.update(tags => tags.filter(t => t !== tag));
  }

  // Question Studio Methods
  addQuestion(type: V3QuestionType = 'Single choice') {
    const newId = `q-${Date.now()}-${this.questions().length + 1}`;
    const mappedType = this.mapV3TypeToInternal(type);
    const isManual = type === 'Q&A' || type === 'File upload';

    const defaultOptions: AssessmentQuestionOption[] =
      type === 'Single choice' || type === 'Multiple choice'
        ? [
            { optionId: `opt-1`, text: 'Option A', correct: true },
            { optionId: `opt-2`, text: 'Option B', correct: false },
            { optionId: `opt-3`, text: 'Option C', correct: false },
            { optionId: `opt-4`, text: 'Option D', correct: false }
          ]
        : [];

    const newQ: AssessmentQuestion = {
      questionId: newId,
      type: mappedType,
      text: '',
      required: true,
      points: this.isSurvey() ? 0 : 5,
      difficulty: 'Beginner',
      manualGraded: isManual,
      order: this.questions().length + 1,
      options: defaultOptions,
      acceptedBlankAnswers: type === 'Fill in the blank' ? ['correct answer'] : undefined
    };

    this.questions.update(qs => [...qs, newQ]);
    this.activeQuestionIndex.set(this.questions().length - 1);
  }

  removeQuestion(index: number) {
    this.questions.update(qs => {
      const updated = qs.filter((_, idx) => idx !== index);
      return updated.map((q, idx) => ({ ...q, order: idx + 1 }));
    });
    if (this.activeQuestionIndex() !== null && this.activeQuestionIndex()! >= this.questions().length) {
      this.activeQuestionIndex.set(this.questions().length > 0 ? this.questions().length - 1 : null);
    }
  }

  moveQuestion(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= this.questions().length) return;
    this.questions.update(qs => {
      const arr = [...qs];
      const [moved] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, moved);
      return arr.map((q, idx) => ({ ...q, order: idx + 1 }));
    });
    this.activeQuestionIndex.set(toIndex);
  }

  updateActiveQuestion(patch: Partial<AssessmentQuestion>) {
    const idx = this.activeQuestionIndex();
    if (idx === null || idx < 0 || idx >= this.questions().length) return;
    this.questions.update(qs =>
      qs.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  // Options management for choice questions
  addOption() {
    const idx = this.activeQuestionIndex();
    if (idx === null) return;
    const q = this.questions()[idx];
    const opts = q.options || [];
    const newOpt: AssessmentQuestionOption = {
      optionId: `opt-${Date.now()}-${opts.length + 1}`,
      text: `Option ${String.fromCharCode(65 + opts.length)}`,
      correct: false
    };
    this.updateActiveQuestion({ options: [...opts, newOpt] });
  }

  removeOption(optIndex: number) {
    const idx = this.activeQuestionIndex();
    if (idx === null) return;
    const q = this.questions()[idx];
    const opts = (q.options || []).filter((_, i) => i !== optIndex);
    this.updateActiveQuestion({ options: opts });
  }

  toggleOptionCorrect(optIndex: number, isMulti: boolean) {
    const idx = this.activeQuestionIndex();
    if (idx === null) return;
    const q = this.questions()[idx];
    const opts = (q.options || []).map((opt, i) => {
      if (isMulti) {
        return i === optIndex ? { ...opt, correct: !opt.correct } : opt;
      } else {
        return { ...opt, correct: i === optIndex };
      }
    });
    this.updateActiveQuestion({ options: opts });
  }

  updateOptionText(optIndex: number, text: string) {
    const idx = this.activeQuestionIndex();
    if (idx === null) return;
    const q = this.questions()[idx];
    const opts = (q.options || []).map((opt, i) => (i === optIndex ? { ...opt, text } : opt));
    this.updateActiveQuestion({ options: opts });
  }

  // Fill in the blank answers
  updateAcceptedBlanks(raw: string) {
    const blanks = raw.split(',').map(s => s.trim()).filter(Boolean);
    this.updateActiveQuestion({ acceptedBlankAnswers: blanks });
  }

  resamplePreview() {
    this.previewSampleSeed.update(s => s + 1);
  }

  // Author Task/Brief Attachment Processing (§2.3b Format: File-upload)
  async processAuthorAttachment(file: File) {
    const idx = this.activeQuestionIndex();
    if (idx === null || idx < 0 || idx >= this.questions().length) return;
    const targetQId = this.questions()[idx].questionId;

    const fileNameLower = file.name.toLowerCase();
    const hasValidExt = this.fileUploadPolicy.allowedExts.some(ext => fileNameLower.endsWith(ext));
    if (!hasValidExt) {
      this.attachmentError.set(`Unsupported format for "${file.name}". Allowed: ${this.fileUploadPolicy.label}`);
      return;
    }

    if (file.size > this.fileUploadPolicy.maxBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      this.attachmentError.set(`File "${file.name}" exceeds 50MB limit (${sizeMb} MB).`);
      return;
    }

    this.attachmentError.set(null);
    this.isUploadingAttachment.set(true);

    const assetId = `asset-${targetQId}-${Date.now()}`;
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    // Persist Blob to browser IndexedDB
    const saved = await LocalPersistenceRepository.saveQuestionAsset(assetId, file, file.name);
    if (!saved) {
      console.warn('Could not store file blob into IndexedDB, metadata will still be recorded');
    }

    const attachment: QuestionAuthorAttachment = {
      assetId,
      fileName: file.name,
      fileSize: sizeFormatted,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString()
    };

    // Update question safely by stable ID
    this.questions.update(qs =>
      qs.map(q => {
        if (q.questionId === targetQId) {
          return {
            ...q,
            authorAttachment: attachment,
            text: q.text && q.text.trim() ? q.text : file.name
          };
        }
        return q;
      })
    );

    this.isUploadingAttachment.set(false);
  }

  onAttachmentFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.processAuthorAttachment(target.files[0]);
      target.value = '';
    }
  }

  onAttachmentDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDraggingAttachment.set(true);
  }

  onAttachmentDragLeave(event: DragEvent) {
    this.isDraggingAttachment.set(false);
  }

  onAttachmentDrop(event: DragEvent) {
    event.preventDefault();
    this.isDraggingAttachment.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processAuthorAttachment(event.dataTransfer.files[0]);
    }
  }

  removeAuthorAttachment() {
    const idx = this.activeQuestionIndex();
    if (idx === null || idx < 0 || idx >= this.questions().length) return;
    const q = this.questions()[idx];
    if (q.authorAttachment?.assetId) {
      LocalPersistenceRepository.deleteQuestionAsset(q.authorAttachment.assetId);
    }
    this.updateActiveQuestion({ authorAttachment: undefined });
    this.attachmentError.set(null);
  }

  async downloadAuthorAttachment(attachment?: QuestionAuthorAttachment) {
    if (!attachment) return;
    const record = await LocalPersistenceRepository.getQuestionAsset(attachment.assetId);
    if (record && record.blob) {
      const url = URL.createObjectURL(record.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName || record.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      alert(`Asset "${attachment.fileName}" is not cached in local browser storage on this device.`);
    }
  }

  mapV3TypeToInternal(v3Type: V3QuestionType): any {
    switch (v3Type) {
      case 'Single choice': return 'singleSelect';
      case 'Multiple choice': return 'multiSelect';
      case 'Fill in the blank': return 'fillBlank';
      case 'Q&A': return 'essay';
      case 'File upload': return 'fileUpload';
      default: return 'singleSelect';
    }
  }

  mapInternalToV3Type(internalType: string): V3QuestionType {
    switch (internalType) {
      case 'singleSelect':
      case 'trueFalse':
        return 'Single choice';
      case 'multiSelect':
        return 'Multiple choice';
      case 'fillBlank':
        return 'Fill in the blank';
      case 'essay':
      case 'text':
        return 'Q&A';
      case 'fileUpload':
        return 'File upload';
      default:
        return 'Single choice';
    }
  }
}
